"use client";

import React from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  PrimaryButton,
  GhostButton,
  HelpCard,
} from "@/app/components/talabat-ui";

function ReportCard({
  icon: Icon,
  tone,
  title,
  description,
  primaryLabel,
  primaryIcon,
  secondaryLabel,
  secondaryIcon,
  isRTL,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "orange" | "red";
  title: string;
  description: string;
  primaryLabel: string;
  primaryIcon?: React.ComponentType<{ className?: string }>;
  secondaryLabel?: string;
  secondaryIcon?: React.ComponentType<{ className?: string }>;
  isRTL?: boolean;
}) {
  const iconBg =
    tone === "orange"
      ? "bg-[#fff1e8] text-[#ff5a00]"
      : "bg-[#fef1f1] text-[#b91c1c]";
  return (
    <SectionCard padding="lg">
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-5", iconBg)}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-[#111] mb-2">{title}</h3>
      <p className="text-sm text-[#6b7280] leading-relaxed mb-6 max-w-md">
        {description}
      </p>
      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        {secondaryLabel && (
          <GhostButton icon={secondaryIcon}>{secondaryLabel}</GhostButton>
        )}
        <PrimaryButton icon={primaryIcon}>{primaryLabel}</PrimaryButton>
      </div>
    </SectionCard>
  );
}

function MetricBox({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p className="text-[28px] font-bold text-[#111]">{value}</p>
        {delta && (
          <span
            className={cn(
              "text-xs font-semibold",
              up ? "text-[#1e8e3e]" : "text-[#b91c1c]"
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { t, isRTL } = useLanguage();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.reportsTitle}
        subtitle={t.reportsSubtitle}
        isRTL={isRTL}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportCard
          icon={FileSpreadsheet}
          tone="orange"
          title={t.monthlySummary}
          description={t.monthlySummaryDesc}
          primaryLabel={t.export}
          primaryIcon={Download}
          secondaryLabel={t.selectMonth}
          secondaryIcon={Calendar}
          isRTL={isRTL}
        />
        <ReportCard
          icon={AlertCircle}
          tone="red"
          title={t.anomalyDetection}
          description={t.anomalyDesc}
          primaryLabel={t.analyzeData}
          primaryIcon={TrendingUp}
          isRTL={isRTL}
        />
      </div>

      <SectionCard padding="lg">
        <h3 className="text-sm font-bold text-[#111] mb-6">
          {t.teamPerformance}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <MetricBox label={t.avgHoursPerDay} value="7.8h" delta="+4%" up />
          <MetricBox label={t.onTimeRate} value="92%" delta="-2%" up={false} />
          <MetricBox label={t.workingDays} value="22d" />
          <MetricBox label={t.activeEmployees} value="24" />
        </div>
      </SectionCard>

      <HelpCard
        title={t.needHelpTitle}
        subtitle={t.needHelpSubtitle}
        moreLabel={t.more}
        isRTL={isRTL}
        articles={[
          { title: t.article1Title, description: t.article1Desc },
          { title: t.article2Title, description: t.article2Desc },
          { title: t.article3Title, description: t.article3Desc },
          { title: t.article4Title, description: t.article4Desc },
        ]}
      />
    </div>
  );
}
