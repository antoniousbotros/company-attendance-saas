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
