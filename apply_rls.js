const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
   console.error("Missing credentials!");
   process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
   const { error } = await supabaseAdmin.rpc('exec_sql', {
       sql_string: `
           ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Owners can manage custom_fields" ON public.custom_fields;
            CREATE POLICY "Owners can manage custom_fields" ON public.custom_fields
                FOR ALL USING (
                    team_id IN (
                        SELECT id FROM public.teams WHERE company_id IN (
                            SELECT id FROM public.companies WHERE owner_id = auth.uid()
                        )
                    )
                );

            ALTER TABLE public.report_values ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Owners can manage report_values" ON public.report_values;
            CREATE POLICY "Owners can manage report_values" ON public.report_values
                FOR ALL USING (
                    report_id IN (
                        SELECT id FROM public.reports WHERE company_id IN (
                            SELECT id FROM public.companies WHERE owner_id = auth.uid()
                        )
                    )
                );
       `
   });

   if (error) {
       console.error("RPC failed, trying raw query...", error);
   } else {
       console.log("Success via RPC!");
   }
}

runSQL();
