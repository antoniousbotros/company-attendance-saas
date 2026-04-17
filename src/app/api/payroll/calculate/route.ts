import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

function getExpectedWorkingDays(monthStr: string, allowedDays: string[], holidays: string[]): {
  totalDays: number,
  expectedDates: string[]
} {
  const [year, month] = monthStr.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  let totalDays = 0;
  const expectedDates: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayName = daysOfWeek[dateObj.getDay()];
    const dateStr = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD local

    if (allowedDays.includes(dayName) && !holidays.includes(dateStr)) {
      totalDays++;
      expectedDates.push(dateStr);
    }
  }

  return { totalDays, expectedDates };
}

export async function POST(req: NextRequest) {
  try {
    const { company_id, month } = await req.json(); // month e.g. "2026-04"

    if (!company_id || !month) {
      return NextResponse.json({ ok: false, error: "Missing company_id or month" }, { status: 400 });
    }

    // 1. Fetch Company Policies
    const { data: company, error: compErr } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", company_id)
      .single();

    if (compErr || !company) return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });

    const workingDaysCfg = company.working_days || ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const holidaysCfg = company.holidays || [];
    const latePenaltyConf = company.late_penalty_per_minute || 1.0;
    const absencePenaltyConf = company.absence_penalty_per_day || 1.0;
    const overtimeEnabled = company.overtime_enabled || false;
    const halfDayEnabled = company.half_day_enabled || false;
    const halfDayHours = company.half_day_hours || 4.0;

    const { totalDays: expectedWorkingDays, expectedDates } = getExpectedWorkingDays(month, workingDaysCfg, holidaysCfg);

    // 2. Fetch Employees
    const { data: employees } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("company_id", company_id);

    if (!employees || employees.length === 0) return NextResponse.json({ ok: true, message: "No employees found" });

    // 3. Process Each Employee
    for (const emp of employees) {
      // Get all attendance for the month
      const [year, m] = month.split('-');
      const lastDay = new Date(Number(year), Number(m), 0).getDate();
      const startDate = `${year}-${m}-01`;
      const endDate = `${year}-${m}-${lastDay}`;

      const { data: attendance } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("employee_id", emp.id)
        .gte("date", startDate)
        .lte("date", endDate);

      let presentDays = 0;
      let totalHours = 0;
      let lateMinutes = 0;
      let overtimeHours = 0;
      let halfDaysCount = 0;

      if (attendance) {
        for (const record of attendance) {
          if (record.status === 'present' || record.status === 'late') {
            const dailyHours = Number(record.working_hours || 0);
            
            if (halfDayEnabled && dailyHours > 0 && dailyHours < halfDayHours) {
              halfDaysCount++;
            } else {
              presentDays++;
            }
          }
          totalHours += Number(record.working_hours || 0);
          lateMinutes += Number(record.late_minutes || 0);

          // Calculate daily overtime if enabled
          if (overtimeEnabled && emp.working_hours_per_day) {
            const dailyHours = Number(record.working_hours || 0);
            if (dailyHours > emp.working_hours_per_day) {
              overtimeHours += (dailyHours - emp.working_hours_per_day);
            }
          }
        }
      }

      // Salary Calculation
      let baseSalaryCalc = 0;
      let dailyRateForDeduction = 0;
      const contractBase = Number(emp.base_salary || 0);
      const otRate = Number(emp.overtime_rate || 1.5);

      if (emp.salary_type === "monthly") {
        baseSalaryCalc = contractBase;
        dailyRateForDeduction = expectedWorkingDays > 0 ? (contractBase / expectedWorkingDays) : 0;
      } else if (emp.salary_type === "daily") {
        baseSalaryCalc = presentDays * contractBase;
        dailyRateForDeduction = contractBase;
      } else if (emp.salary_type === "hourly") {
        baseSalaryCalc = totalHours * contractBase;
        dailyRateForDeduction = 0;
      } else {
        baseSalaryCalc = contractBase;
      }

      // Deductions
      // Absent days = Expected - (Full Present + Half Days)
      // Because a half day is still a day they showed up, so it covers 1 expected day, but we penalize it separately.
      let absentDays = expectedWorkingDays - (presentDays + halfDaysCount);
      if (absentDays < 0) absentDays = 0;

      let absenceDeduction = absentDays * dailyRateForDeduction * absencePenaltyConf;
      let halfDayDeduction = halfDaysCount * (0.5 * dailyRateForDeduction * absencePenaltyConf);
      let lateDeduction = lateMinutes * latePenaltyConf;
      
      // If daily/hourly, they don't get technically "deducted" for absence as base is lower, 
      // but maybe penalty applies if absencePenaltyConf > 1.0. Let's keep it standard.
      if (emp.salary_type !== "monthly") {
         absenceDeduction = 0;
         halfDayDeduction = 0;
      }

      const totalDeductions = absenceDeduction + halfDayDeduction + lateDeduction;

      // Bonuses
      const overtimePay = overtimeEnabled ? (overtimeHours * otRate) : 0;

      // Final
      const finalSalary = baseSalaryCalc - totalDeductions + overtimePay;

      // Upsert into Payroll
      await supabaseAdmin
        .from("payroll")
        .upsert({
          company_id: company.id,
          employee_id: emp.id,
          month: month,
          total_working_days: expectedWorkingDays,
          present_days: presentDays,
          absent_days: absentDays,
          total_hours: totalHours,
          late_minutes: lateMinutes,
          overtime_hours: overtimeHours,
          half_days: halfDaysCount,
          base_salary: baseSalaryCalc,
          deductions: totalDeductions,
          bonuses: overtimePay,
          final_salary: finalSalary
        }, { onConflict: "employee_id, month" });
    }

    return NextResponse.json({ ok: true, message: "Payroll calculated successfully" });

  } catch (err: any) {
    console.error("Payroll Calc Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
