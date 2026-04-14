-- Enable security on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Allow company owners to fully manage team_members for their teams
DROP POLICY IF EXISTS "Owners can manage team_members" ON public.team_members;
CREATE POLICY "Owners can manage team_members" ON public.team_members
    FOR ALL USING (
        team_id IN (
            SELECT id FROM public.teams WHERE company_id IN (
                SELECT id FROM public.companies WHERE owner_id = auth.uid()
            )
        )
    );
