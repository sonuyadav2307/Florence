-- Authorization notes for database tests.
-- Run against a dedicated Supabase branch with pgTAP or SQL assertions.
-- Required cases:
-- 1. Anonymous users cannot select projects or catalog rows.
-- 2. A member can read only their workspace row and projects.
-- 3. An editor can execute create_project, save_project, and duplicate_project.
-- 4. A viewer executing those RPCs is rejected.
-- 5. A user from another workspace cannot read or mutate a foreign project id.
-- 6. Direct UPDATE on public.projects by authenticated is denied.

select 'See Florence_Build_Specification.md section 18 for SEC 01-04.';
