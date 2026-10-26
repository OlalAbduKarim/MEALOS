-- ====================================================================
-- MEAL INSIGHTS OS — COMPLETE POSTGRESQL / SUPABASE PRODUCTION SCHEMA
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANISATIONS (Multi-Tenant Root)
CREATE TABLE IF NOT EXISTS public.organisations (
    id TEXT PRIMARY KEY DEFAULT 'org_' || substring(uuid_generate_v4()::text, 1, 8),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    sector TEXT,
    country TEXT,
    currency TEXT DEFAULT 'USD ($)',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY,
    organisation_id TEXT REFERENCES public.organisations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'meal_officer', -- 'platform_admin', 'org_admin', 'project_manager', 'meal_officer', 'enumerator', 'reviewer', 'analyst', 'viewer'
    active_project_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY DEFAULT 'proj_' || substring(uuid_generate_v4()::text, 1, 8),
    organisation_id TEXT REFERENCES public.organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    code TEXT,
    sector TEXT,
    location TEXT,
    budget NUMERIC,
    currency TEXT DEFAULT 'USD ($)',
    status TEXT DEFAULT 'Active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    manager_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDICATORS
CREATE TABLE IF NOT EXISTS public.indicators (
    id TEXT PRIMARY KEY DEFAULT 'ind_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    unit_of_measure TEXT NOT NULL,
    data_type TEXT NOT NULL DEFAULT 'Numeric', -- 'Numeric', 'Percentage', 'Text'
    target_value NUMERIC NOT NULL,
    baseline_value NUMERIC DEFAULT 0,
    baseline_date DATE,
    directionality TEXT DEFAULT 'higher_is_better', -- 'higher_is_better', 'lower_is_better', 'target_range'
    sector TEXT,
    frequency TEXT,
    responsible_officer TEXT,
    calculation_formula TEXT,
    aggregation_type TEXT DEFAULT 'Sum',
    target_period TEXT DEFAULT 'cumulative',
    status_thresholds JSONB DEFAULT '{"offTrackLessThan": 70, "atRiskLessThan": 90}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DATA POINTS
CREATE TABLE IF NOT EXISTS public.data_points (
    id TEXT PRIMARY KEY DEFAULT 'dp_' || substring(uuid_generate_v4()::text, 1, 8),
    indicator_id TEXT REFERENCES public.indicators(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    actual_value NUMERIC NOT NULL,
    collection_date DATE NOT NULL,
    notes TEXT,
    numerator NUMERIC,
    denominator NUMERIC,
    verification_status TEXT DEFAULT 'verified', -- 'draft', 'under_review', 'verified', 'rejected'
    verified_by TEXT,
    tags JSONB DEFAULT '{}',
    disaggregated_values JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROGRAMMATIC FRAMEWORKS
CREATE TABLE IF NOT EXISTS public.theories_of_change (
    id TEXT PRIMARY KEY DEFAULT 'toc_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    inputs TEXT DEFAULT '',
    activities TEXT DEFAULT '',
    outputs TEXT DEFAULT '',
    outcomes TEXT DEFAULT '',
    impact TEXT DEFAULT '',
    assumptions TEXT DEFAULT '',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logical_frameworks (
    id TEXT PRIMARY KEY DEFAULT 'lf_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    goal TEXT DEFAULT '',
    outcomes TEXT DEFAULT '',
    outputs TEXT DEFAULT '',
    activities TEXT DEFAULT '',
    goal_indicators TEXT DEFAULT '',
    outcome_indicators TEXT DEFAULT '',
    output_indicators TEXT DEFAULT '',
    activity_indicators TEXT DEFAULT '',
    goal_mov TEXT DEFAULT '',
    outcome_mov TEXT DEFAULT '',
    output_mov TEXT DEFAULT '',
    activity_mov TEXT DEFAULT '',
    goal_assumptions TEXT DEFAULT '',
    outcome_assumptions TEXT DEFAULT '',
    output_assumptions TEXT DEFAULT '',
    activity_assumptions TEXT DEFAULT '',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.results_chains (
    id TEXT PRIMARY KEY DEFAULT 'rc_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    inputs TEXT DEFAULT '',
    activities TEXT DEFAULT '',
    outputs TEXT DEFAULT '',
    short_term_outcomes TEXT DEFAULT '',
    medium_term_outcomes TEXT DEFAULT '',
    long_term_impact TEXT DEFAULT '',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COLLECTION FORMS & SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.collection_forms (
    id TEXT PRIMARY KEY DEFAULT 'form_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    version INT DEFAULT 1,
    status TEXT DEFAULT 'published',
    fields JSONB DEFAULT '[]',
    target_submissions INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.form_submissions (
    id TEXT PRIMARY KEY DEFAULT 'sub_' || substring(uuid_generate_v4()::text, 1, 8),
    form_id TEXT REFERENCES public.collection_forms(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    enumerator_id TEXT NOT NULL,
    enumerator_name TEXT NOT NULL,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'submitted', -- 'draft', 'submitted', 'under_review', 'approved', 'returned'
    review_notes TEXT,
    reviewer_name TEXT,
    verified_by TEXT,
    approved_at TIMESTAMPTZ,
    gps_location JSONB
);

-- 8. SAFEGUARDING & COMMUNITY ACCOUNTABILITY (Strict Isolation)
CREATE TABLE IF NOT EXISTS public.safeguarding_complaints (
    id TEXT PRIMARY KEY DEFAULT 'cmp_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    reference_code TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Service Delivery', 'Staff Conduct', 'Fraud/Corruption', 'Safeguarding', 'Feedback'
    channel TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    complainant_name TEXT,
    complainant_contact TEXT,
    description TEXT NOT NULL,
    is_safeguarding_sensitive BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'received',
    assigned_to TEXT,
    date_received DATE DEFAULT CURRENT_DATE,
    resolution_summary TEXT,
    resolved_at TIMESTAMPTZ
);

-- 9. RISK REGISTER
CREATE TABLE IF NOT EXISTS public.risk_items (
    id TEXT PRIMARY KEY DEFAULT 'risk_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    likelihood INT CHECK (likelihood BETWEEN 1 AND 5),
    impact INT CHECK (impact BETWEEN 1 AND 5),
    rating INT GENERATED ALWAYS AS (likelihood * impact) STORED,
    early_warning_indicator TEXT,
    mitigation TEXT NOT NULL,
    owner TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    review_date DATE
);

-- 10. EVALUATIONS, STORIES, LESSONS, SITES & REPORTS
CREATE TABLE IF NOT EXISTS public.evaluations (
    id TEXT PRIMARY KEY DEFAULT 'eval_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'planned',
    lead_evaluator TEXT NOT NULL,
    budget NUMERIC,
    criteria TEXT[] DEFAULT '{}',
    key_findings TEXT,
    recommendations TEXT[] DEFAULT '{}',
    start_date DATE,
    end_date DATE,
    report_url TEXT
);

CREATE TABLE IF NOT EXISTS public.success_stories (
    id TEXT PRIMARY KEY DEFAULT 'story_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    narrative TEXT NOT NULL,
    date_added DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.lessons_learned (
    id TEXT PRIMARY KEY DEFAULT 'lesson_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date_documented DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.geo_sites (
    id TEXT PRIMARY KEY DEFAULT 'site_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    district TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    beneficiaries_targeted INT,
    indicators_measured TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.meal_reports (
    id TEXT PRIMARY KEY DEFAULT 'rep_' || substring(uuid_generate_v4()::text, 1, 8),
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    report_type TEXT NOT NULL,
    reporting_period TEXT NOT NULL,
    executive_summary TEXT,
    indicator_snapshots JSONB DEFAULT '[]',
    findings TEXT,
    status TEXT DEFAULT 'draft',
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT LOGS (Append-Only Ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT 'audit_' || substring(uuid_generate_v4()::text, 1, 8),
    organisation_id TEXT,
    project_id TEXT,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- SEED INITIAL DEFAULT ORGANISATION & PROJECT IF EMPTY
INSERT INTO public.organisations (id, name, code, sector, country, currency)
VALUES ('org_gh_health', 'Global Health & Education Alliance (GHEA)', 'GHEA', 'Maternal Health & Primary Education', 'Uganda & East Africa', 'USD ($)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, organisation_id, name, description, code, sector, start_date, end_date, budget, status)
VALUES (
    'proj_001',
    'org_gh_health',
    'Maternal, Child Health & Nutrition Acceleration Initiative',
    'USAID/PEPFAR funded multi-district clinical quality improvement and community nutrition initiative.',
    'MCHN-2024-UGA',
    'Health',
    '2024-01-01',
    '2026-12-31',
    2450000,
    'Active'
)
ON CONFLICT (id) DO NOTHING;

-- ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theories_of_change ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logical_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safeguarding_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Standard Public Access Policies for Anon / Authenticated Users
CREATE POLICY "Allow public read access to organisations" ON public.organisations FOR SELECT USING (true);
CREATE POLICY "Allow public all access to projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Allow public all access to indicators" ON public.indicators FOR ALL USING (true);
CREATE POLICY "Allow public all access to data_points" ON public.data_points FOR ALL USING (true);
CREATE POLICY "Allow public all access to theories_of_change" ON public.theories_of_change FOR ALL USING (true);
CREATE POLICY "Allow public all access to logical_frameworks" ON public.logical_frameworks FOR ALL USING (true);
CREATE POLICY "Allow public all access to results_chains" ON public.results_chains FOR ALL USING (true);
CREATE POLICY "Allow public all access to collection_forms" ON public.collection_forms FOR ALL USING (true);
CREATE POLICY "Allow public all access to form_submissions" ON public.form_submissions FOR ALL USING (true);
CREATE POLICY "Allow public all access to safeguarding_complaints" ON public.safeguarding_complaints FOR ALL USING (true);
CREATE POLICY "Allow public all access to risk_items" ON public.risk_items FOR ALL USING (true);
CREATE POLICY "Allow public all access to evaluations" ON public.evaluations FOR ALL USING (true);
CREATE POLICY "Allow public all access to success_stories" ON public.success_stories FOR ALL USING (true);
CREATE POLICY "Allow public all access to lessons_learned" ON public.lessons_learned FOR ALL USING (true);
CREATE POLICY "Allow public all access to geo_sites" ON public.geo_sites FOR ALL USING (true);
CREATE POLICY "Allow public all access to meal_reports" ON public.meal_reports FOR ALL USING (true);
CREATE POLICY "Allow public read and insert on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
