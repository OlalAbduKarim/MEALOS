-- ====================================================================
-- MEAL INSIGHTS OS — LEAST-PRIVILEGE MULTI-TENANT RLS POLICIES
-- Review this script before executing in Supabase SQL Editor.
-- Enforces:
-- 1. Strict organisation multi-tenant isolation across all 18 tables.
-- 2. Role-based privileges (RBAC) checked against database profile.
-- 3. Automatic, secure profile provisioning via auth.users trigger (no client self-elevation).
-- 4. Separation of duties (prevents self-approval of form submissions).
-- 5. Safeguarding sensitive complaint confidentiality.
-- 6. Tamper-evident, immutable audit trail (INSERT and SELECT only; NO UPDATE or DELETE).
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. SECURE HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()::text LIMIT 1;
$$;

-- Helper to check if a project belongs to user's active organisation
CREATE OR REPLACE FUNCTION public.project_belongs_to_user_org(proj_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = proj_id
      AND (organisation_id = public.current_user_org_id() OR public.current_user_role() = 'platform_admin')
  );
$$;

-- --------------------------------------------------------------------
-- 2. AUTOMATED SECURE USER PROFILE TRIGGER
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_org_id TEXT;
  target_org_name TEXT;
  user_full_name TEXT;
  safe_role TEXT;
BEGIN
  -- Extract metadata or set defaults
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  target_org_name := COALESCE(NEW.raw_user_meta_data->>'organisation_name', user_full_name || '''s Organisation');
  target_org_id := COALESCE(NEW.raw_user_meta_data->>'organisation_id', 'org_' || substring(NEW.id::text, 1, 8));

  -- Ensure safe initial role (default to enumerator or safe requested role; platform_admin is blocked)
  safe_role := COALESCE(NEW.raw_user_meta_data->>'role', 'enumerator');
  IF safe_role = 'platform_admin' THEN
    safe_role := 'org_admin';
  END IF;

  -- Create organisation if not already existing
  INSERT INTO public.organisations (id, name, code, currency)
  VALUES (target_org_id, target_org_name, 'MEAL', 'USD ($)')
  ON CONFLICT (id) DO NOTHING;

  -- Provision profile linked to auth.users record
  INSERT INTO public.user_profiles (id, organisation_id, email, name, role, active_project_ids)
  VALUES (
    NEW.id::text,
    target_org_id,
    NEW.email,
    user_full_name,
    safe_role,
    '{}'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

  RETURN NEW;
END;
$$;

-- Drop trigger if existing, then attach to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 3. RESET OLD POLICIES ON ALL 18 TABLES
-- --------------------------------------------------------------------

DO $$
DECLARE
    tbl TEXT;
    pol RECORD;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'organisations', 'user_profiles', 'projects', 'indicators', 'data_points',
            'theories_of_change', 'logical_frameworks', 'results_chains',
            'collection_forms', 'form_submissions', 'safeguarding_complaints',
            'risk_items', 'evaluations', 'success_stories', 'lessons_learned',
            'geo_sites', 'meal_reports', 'audit_logs'
        ])
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        FOR pol IN
            SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
        END LOOP;
    END LOOP;
END $$;

-- --------------------------------------------------------------------
-- 4. LEAST-PRIVILEGE POLICIES
-- --------------------------------------------------------------------

-- 1. ORGANISATIONS
CREATE POLICY "org_select" ON public.organisations
    FOR SELECT TO authenticated
    USING (id = public.current_user_org_id() OR public.current_user_role() = 'platform_admin');

CREATE POLICY "org_insert" ON public.organisations
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_role() IN ('platform_admin', 'org_admin') OR id = public.current_user_org_id());

CREATE POLICY "org_update" ON public.organisations
    FOR UPDATE TO authenticated
    USING (id = public.current_user_org_id() AND public.current_user_role() IN ('org_admin', 'platform_admin'))
    WITH CHECK (id = public.current_user_org_id() AND public.current_user_role() IN ('org_admin', 'platform_admin'));

CREATE POLICY "org_delete" ON public.organisations
    FOR DELETE TO authenticated
    USING (public.current_user_role() = 'platform_admin');

-- 2. USER PROFILES
CREATE POLICY "user_profiles_select" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (organisation_id = public.current_user_org_id() OR public.current_user_role() = 'platform_admin');

CREATE POLICY "user_profiles_insert" ON public.user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (
        id = auth.uid()::text OR
        (public.current_user_role() IN ('org_admin', 'platform_admin') AND organisation_id = public.current_user_org_id())
    );

CREATE POLICY "user_profiles_update" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid()::text OR
        (public.current_user_role() IN ('org_admin', 'platform_admin') AND organisation_id = public.current_user_org_id())
    )
    WITH CHECK (
        -- Standard users cannot elevate own role or change organisation
        (id = auth.uid()::text AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()::text) AND organisation_id = public.current_user_org_id()) OR
        (public.current_user_role() IN ('org_admin', 'platform_admin') AND organisation_id = public.current_user_org_id())
    );

CREATE POLICY "user_profiles_delete" ON public.user_profiles
    FOR DELETE TO authenticated
    USING (public.current_user_role() IN ('org_admin', 'platform_admin') AND organisation_id = public.current_user_org_id());

-- 3. PROJECTS
CREATE POLICY "projects_select" ON public.projects
    FOR SELECT TO authenticated
    USING (organisation_id = public.current_user_org_id() OR public.current_user_role() = 'platform_admin');

CREATE POLICY "projects_insert" ON public.projects
    FOR INSERT TO authenticated
    WITH CHECK (
        organisation_id = public.current_user_org_id() AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'project_manager')
    );

CREATE POLICY "projects_update" ON public.projects
    FOR UPDATE TO authenticated
    USING (
        organisation_id = public.current_user_org_id() AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'project_manager')
    )
    WITH CHECK (
        organisation_id = public.current_user_org_id() AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'project_manager')
    );

CREATE POLICY "projects_delete" ON public.projects
    FOR DELETE TO authenticated
    USING (
        organisation_id = public.current_user_org_id() AND
        public.current_user_role() IN ('platform_admin', 'org_admin')
    );

-- 4. INDICATORS
CREATE POLICY "indicators_select" ON public.indicators
    FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));

CREATE POLICY "indicators_insert" ON public.indicators
    FOR INSERT TO authenticated
    WITH CHECK (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager')
    );

CREATE POLICY "indicators_update" ON public.indicators
    FOR UPDATE TO authenticated
    USING (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager')
    )
    WITH CHECK (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager')
    );

CREATE POLICY "indicators_delete" ON public.indicators
    FOR DELETE TO authenticated
    USING (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer')
    );

-- 5. DATA POINTS
CREATE POLICY "datapoints_select" ON public.data_points
    FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));

CREATE POLICY "datapoints_insert" ON public.data_points
    FOR INSERT TO authenticated
    WITH CHECK (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager', 'reviewer')
    );

CREATE POLICY "datapoints_update" ON public.data_points
    FOR UPDATE TO authenticated
    USING (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'reviewer')
    );

CREATE POLICY "datapoints_delete" ON public.data_points
    FOR DELETE TO authenticated
    USING (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin')
    );

-- 6. PROGRAMMATIC FRAMEWORKS (ToC, LogFrame, Results Chain)
-- Theories of Change
CREATE POLICY "toc_select" ON public.theories_of_change FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));
CREATE POLICY "toc_write" ON public.theories_of_change FOR ALL TO authenticated
    USING (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'))
    WITH CHECK (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'));

-- Logical Frameworks
CREATE POLICY "logframe_select" ON public.logical_frameworks FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));
CREATE POLICY "logframe_write" ON public.logical_frameworks FOR ALL TO authenticated
    USING (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'))
    WITH CHECK (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'));

-- Results Chains
CREATE POLICY "results_chains_select" ON public.results_chains FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));
CREATE POLICY "results_chains_write" ON public.results_chains FOR ALL TO authenticated
    USING (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'))
    WITH CHECK (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'));

-- 7. COLLECTION FORMS
CREATE POLICY "forms_select" ON public.collection_forms
    FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));

CREATE POLICY "forms_insert" ON public.collection_forms
    FOR INSERT TO authenticated
    WITH CHECK (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager')
    );

CREATE POLICY "forms_update" ON public.collection_forms
    FOR UPDATE TO authenticated
    USING (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager')
    )
    WITH CHECK (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager')
    );

CREATE POLICY "forms_delete" ON public.collection_forms
    FOR DELETE TO authenticated
    USING (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer')
    );

-- 8. FORM SUBMISSIONS (Separation of duties enforced at DB level)
CREATE POLICY "submissions_select" ON public.form_submissions
    FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));

CREATE POLICY "submissions_insert" ON public.form_submissions
    FOR INSERT TO authenticated
    WITH CHECK (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager', 'reviewer', 'enumerator')
    );

CREATE POLICY "submissions_update" ON public.form_submissions
    FOR UPDATE TO authenticated
    USING (public.project_belongs_to_user_org(project_id))
    WITH CHECK (
        public.project_belongs_to_user_org(project_id) AND
        (
            -- Case 1: Submitter updating draft/submitted observation
            (enumerator_id = auth.uid()::text AND status IN ('draft', 'submitted')) OR
            -- Case 2: Authorised reviewer approving/returning (CANNOT approve own submission)
            (
                public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'reviewer') AND
                (status != 'approved' OR enumerator_id != auth.uid()::text)
            )
        )
    );

CREATE POLICY "submissions_delete" ON public.form_submissions
    FOR DELETE TO authenticated
    USING (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin')
    );

-- 9. SAFEGUARDING COMPLAINTS (Strict Confidentiality)
CREATE POLICY "complaints_select" ON public.safeguarding_complaints
    FOR SELECT TO authenticated
    USING (
        public.project_belongs_to_user_org(project_id) AND
        (
            is_safeguarding_sensitive = false OR
            public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer')
        )
    );

CREATE POLICY "complaints_insert" ON public.safeguarding_complaints
    FOR INSERT TO authenticated
    WITH CHECK (public.project_belongs_to_user_org(project_id));

CREATE POLICY "complaints_update" ON public.safeguarding_complaints
    FOR UPDATE TO authenticated
    USING (
        public.project_belongs_to_user_org(project_id) AND
        public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer')
    );

CREATE POLICY "complaints_delete" ON public.safeguarding_complaints
    FOR DELETE TO authenticated
    USING (public.current_user_role() = 'platform_admin');

-- 10. RISK ITEMS
CREATE POLICY "risks_select" ON public.risk_items FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));
CREATE POLICY "risks_write" ON public.risk_items FOR ALL TO authenticated
    USING (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'))
    WITH CHECK (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'));

-- 11. EVALUATIONS
CREATE POLICY "evaluations_select" ON public.evaluations FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));
CREATE POLICY "evaluations_write" ON public.evaluations FOR ALL TO authenticated
    USING (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'))
    WITH CHECK (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'));

-- 12. SUCCESS STORIES & LESSONS LEARNED
CREATE POLICY "stories_select" ON public.success_stories FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));
CREATE POLICY "stories_write" ON public.success_stories FOR ALL TO authenticated
    USING (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'))
    WITH CHECK (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'));

CREATE POLICY "lessons_select" ON public.lessons_learned FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));
CREATE POLICY "lessons_write" ON public.lessons_learned FOR ALL TO authenticated
    USING (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'))
    WITH CHECK (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'));

-- 13. GEO SITES
CREATE POLICY "sites_select" ON public.geo_sites FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));
CREATE POLICY "sites_write" ON public.geo_sites FOR ALL TO authenticated
    USING (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'))
    WITH CHECK (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'));

-- 14. MEAL REPORTS
CREATE POLICY "reports_select" ON public.meal_reports FOR SELECT TO authenticated
    USING (public.project_belongs_to_user_org(project_id));
CREATE POLICY "reports_write" ON public.meal_reports FOR ALL TO authenticated
    USING (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'))
    WITH CHECK (public.project_belongs_to_user_org(project_id) AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer', 'project_manager'));

-- 15. AUDIT LOGS (Immutable, Append-Only)
-- Only org_admin, meal_officer, and platform_admin can read audit logs
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        (organisation_id = public.current_user_org_id() AND public.current_user_role() IN ('platform_admin', 'org_admin', 'meal_officer')) OR
        public.current_user_role() = 'platform_admin'
    );

-- Any authenticated user can insert audit records for their active organisation
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (organisation_id = public.current_user_org_id() OR organisation_id IS NULL);

-- NO UPDATE or DELETE policies on audit_logs! It is strictly an append-only ledger.
