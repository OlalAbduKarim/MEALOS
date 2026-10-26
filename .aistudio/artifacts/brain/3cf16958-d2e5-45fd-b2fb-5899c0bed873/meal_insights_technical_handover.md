# MEAL INSIGHTS OS — TECHNICAL HANDOVER & BACKEND INTEGRATION SPECIFICATION

## Executive Summary
This document provides an exhaustive, production-grade technical handover for connecting the **MEAL Insights OS** frontend to a secure PostgreSQL (Supabase) backend. All evaluations are grounded in the actual codebase (`App.tsx`, `types.ts`, `services/mealStorage.ts`, `services/authService.ts`, `services/apiClient.ts`, and component views).

---

## 1. System Inventory & Operational Status

| Frontend View / Module | Primary File | Current Data Source | Operational Status | Backend Dependency Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Project Workspace / Header** | `ProjectHeader.tsx`, `App.tsx` | `mealStorage` (Local) | Fully Functional | CRUD `/projects` |
| **Indicator Dashboard / Cards** | `IndicatorCard.tsx`, `App.tsx` | `mealStorage` (Local) | Fully Functional | `/indicators`, `/data-points` |
| **Indicator Tracking Table (ITT)**| `IndicatorTrackingTableView.tsx` | In-memory prop filtering | Fully Functional | Aggregated `/indicators/itt` |
| **Indicator Library** | `IndicatorLibraryView.tsx` | `constants.ts` (Static seed) | Read-only / Reference | CRUD `/indicator-library` |
| **PIRS Templates** | `PirsTemplatesView.tsx` | `constants.ts` (`MOCK_PIRS`) | Read-only / Reference | CRUD `/pirs-templates` |
| **Theory of Change Designer** | `TheoryOfChangeVisualizer.tsx` | `mealStorage` (Local) | Fully Functional | CRUD `/frameworks/toc/:projectId` |
| **LogFrame Matrix Designer** | `LogFrameDesignerView.tsx` | `mealStorage` (Local) | Fully Functional | CRUD `/frameworks/logframe/:projectId` |
| **Results Chain Editor** | `ResultsChainEditor.tsx` | `mealStorage` (Local) | Fully Functional | CRUD `/frameworks/results-chain/:projectId` |
| **Form Builder** | `FormBuilderView.tsx` | `mealStorage` (Local) | Fully Functional | CRUD `/forms` |
| **Form Templates Library** | `FormTemplatesView.tsx` | `constants.ts` (Static seed) | Template picker | CRUD `/form-templates` |
| **Mobile App Sync** | `MobileAppSyncView.tsx` | In-memory queue + sim | Simulated Sync | Sync endpoint `POST /sync/batch` |
| **Form Submissions & Verifier** | `FormSubmissionsView.tsx` | `mealStorage` (Local) | Fully Functional (2-step) | Workflow `/submissions/:id/verify` |
| **Data Cleaning Tools** | `DataCleaningToolsView.tsx` | In-memory math calculations | Functional in-browser | Statistical API `/data-cleaning/outliers` |
| **Import Data (CSV/Excel)** | `ImportDataView.tsx` | In-browser CSV parser | Functional in-browser | Ingestion API `/data-points/bulk-import` |
| **Export Data** | `ExportDataView.tsx` | In-browser Blob generator | Functional in-browser | Server export `/export/indicators` |
| **Multi-Project Dashboard** | `MultiProjectDashboardView.tsx` | In-memory prop aggregation | Fully Functional | Cross-project API `/projects/portfolio` |
| **Project Map (GIS)** | `ProjectMapView.tsx` | `mealStorage` (`GEO_SITES`) | Fully Functional (Leaflet/SVG) | GeoJSON API `/geo-sites` |
| **AI Insights** | `AIInsightsView.tsx` | Direct Gemini SDK / Sim | Functional | Secure backend proxy `/ai/generate-insights` |
| **Report Generator** | `ReportGeneratorView.tsx` | `mealStorage` (Local) | Fully Functional | Report storage `/reports` |
| **Risk Register** | `RiskRegisterView.tsx` | `mealStorage` (Local) | Fully Functional | CRUD `/risks` |
| **Evaluation Management** | `EvaluationManagementView.tsx` | `mealStorage` (Local) | Fully Functional | CRUD `/evaluations` |
| **Safeguarding / FCM** | `AccountabilityView.tsx` | `mealStorage` (Local) | Fully Functional (Guarded) | Strict Isolated `/complaints` |
| **Success Stories Repo** | `SuccessStoriesRepoView.tsx` | `mealStorage` (Local) | Fully Functional | CRUD `/success-stories` |
| **Lessons Learned Tracker** | `LessonsLearnedTrackerView.tsx` | `mealStorage` (Local) | Fully Functional | CRUD `/lessons-learned` |
| **User & Role Management** | `UserManagementView.tsx` | `authService` (Persona state) | Client-side persona switch | Identity & RBAC `/users`, `/roles` |
| **Audit Trail** | `AuditTrailView.tsx` | `mealStorage` (Local) | Fully Functional (Local) | Append-only `/audit-logs` |

---

## 2. Complete Data Model & Entity Relationships (`types.ts`)

```
                 ┌────────────────────────────────────────────────────────┐
                 │                      Organisation                      │
                 │ id, name, code, sector, country, currency, dateFormat  │
                 └───────────┬────────────────────────────────┬───────────┘
                             │ 1:N                            │ 1:N
                             ▼                                ▼
                 ┌────────────────────────┐      ┌────────────────────────┐
                 │       UserProfile      │      │        Project         │
                 │ id, email, role, orgId │      │ id, orgId, name, dates │
                 └────────────────────────┘      └───────────┬────────────┘
                                                             │ 1:N
     ┌───────────────────┬───────────────────┬───────────────┴───┬───────────────────┬───────────────────┐
     │                   │                   │                   │                   │                   │
     ▼                   ▼                   ▼                   ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  Indicator   │  │CollectionForm│  │TheoryOfChange  │  │ LogFrame       │  │  RiskItem      │  │ Accountability │
│id, baseline, │  │id, fields[], │  │inputs, outputs,│  │4x4 matrix, MoVs│  │likelihood,     │  │isSafeguarding, │
│target, type  │  │status, target│  │outcomes, impact│  │assumptions     │  │impact, rating  │  │confidential    │
└──────┬───────┘  └──────┬───────┘  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘
       │ 1:N             │ 1:N
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  DataPoint   │  │FormSubmission│
│id, actual,   │◄─┤id, answers,  │
│date, status  │  │verifiedStatus│
└──────────────┘  └──────────────┘
```

---

## 3. Frontend-to-Backend Integration Map

### Module A: Projects & Tenancy
- **User Actions**: Switch organisation, create project, update dates/budget, archive project.
- **Current Source**: `mealStorage.ts` (`meal_organisations`, `me_tracker_projects_list`).
- **Required Endpoints**:
  - `GET /api/v1/organisations` — List user's tenant organisations.
  - `GET /api/v1/projects?orgId=:id` — List projects scoped to organisation.
  - `POST /api/v1/projects` — Create project. Requires `org_admin` or `project_manager`.
  - `PUT /api/v1/projects/:id` — Update project metadata.
- **Permissions**: `viewer` and `enumerator` cannot create or edit projects.

### Module B: Indicators & PIRS
- **User Actions**: Create indicator, define baseline/target, set directionality (`higher_is_better`, `lower_is_better`), configure custom calculation formulas, link PIRS sheets.
- **Current Source**: `mealStorage.ts` (`me_tracker_indicators`).
- **Required Endpoints**:
  - `GET /api/v1/indicators?projectId=:id` — Fetch indicators.
  - `POST /api/v1/indicators` — Create indicator.
  - `PUT /api/v1/indicators/:id` — Update indicator and revised targets.
  - `DELETE /api/v1/indicators/:id` — Guarded: Reject if data points exist.
- **Permissions**: Requires `meal_officer`, `project_manager`, or `org_admin`.

### Module C: Data Points & Aggregation
- **User Actions**: Ingest actual values, enter numerator/denominator for percentages, assign disaggregation tags (Gender, Age, Facility), mark verification status.
- **Current Source**: `mealStorage.ts` (`me_tracker_data_points`).
- **Required Endpoints**:
  - `GET /api/v1/data-points?indicatorId=:id` — Time series measurements.
  - `POST /api/v1/data-points` — Ingest single data point.
  - `POST /api/v1/data-points/bulk-import` — Batch ingestion for Excel/CSV imports.
- **Validation**: Denominator cannot be 0 or negative. Values must conform to `dataType` (Numeric vs Percentage).

### Module D: Programmatic Frameworks (ToC, LogFrame, Results Chain)
- **User Actions**: Edit multi-level text inputs, populate 4x4 LogFrame matrix, load pre-configured sector templates (Health, WASH, Food Security).
- **Current Source**: `mealStorage.ts` (`me_tracker_toc`, `me_tracker_logframe`, `me_tracker_results_chain`).
- **Required Endpoints**:
  - `GET /api/v1/frameworks/toc/:projectId` & `POST /api/v1/frameworks/toc/:projectId`
  - `GET /api/v1/frameworks/logframe/:projectId` & `POST /api/v1/frameworks/logframe/:projectId`
  - `GET /api/v1/frameworks/results-chain/:projectId` & `POST /api/v1/frameworks/results-chain/:projectId`

### Module E: Field Collection, Submissions & 2-Step Verification
- **User Actions**: Build survey forms, fill forms offline, submit to review queue, approve/reject submission.
- **Current Source**: `mealStorage.ts` (`meal_collection_forms`, `meal_form_submissions`).
- **Required Endpoints**:
  - `GET/POST /api/v1/forms` — Survey schema definitions.
  - `GET /api/v1/submissions?formId=:id` — Review queue.
  - `POST /api/v1/submissions` — Field intake.
  - `POST /api/v1/submissions/:id/verify` — Approve submission and generate `DataPoint`.
  - `POST /api/v1/submissions/:id/reject` — Reject with mandatory rationale notes.
- **CRITICAL SECURITY RULE**: **Anti-Self-Approval**: Backend must check `submission.enumeratorId !== authenticatedUser.id`. Reject with 403 if an enumerator attempts to verify their own record.

### Module F: Safeguarding & Accountability (FCM)
- **User Actions**: Log grievance, flag sensitive child protection/SEA complaints, record resolution actions.
- **Current Source**: `mealStorage.ts` (`meal_accountability_complaints`).
- **Required Endpoints**:
  - `GET /api/v1/complaints?projectId=:id` — **Strictly isolated**.
  - `POST /api/v1/complaints` — Public or field intake (supports `isAnonymous: true`).
  - `PUT /api/v1/complaints/:id` — Investigation progress notes.
- **CRITICAL SECURITY RULE**: Queries to `/complaints` where `isSafeguardingSensitive: true` must reject anyone other than `safeguarding_lead` or designated Org Admin.

### Module G: Audit Trail
- **User Actions**: Inspect chronological log of all changes across the organisation.
- **Current Source**: `mealStorage.ts` (`meal_audit_logs`).
- **Required Endpoints**:
  - `GET /api/v1/audit-logs?orgId=:id&projectId=:id` — Filtered audit query.
- **CRITICAL SECURITY RULE**: **Append-Only Immutability**. Backend must have NO update or delete endpoints for audit records.

---

## 4. Review of Current API Client (`services/apiClient.ts`)

### Identified Gaps:
1. **Missing Domain Endpoints**:
   - Indicator Library references (`/indicator-library`)
   - PIRS templates (`/pirs-templates`)
   - Risk Register items (`/risks`)
   - Evaluations (`/evaluations`)
   - Success Stories & Lessons Learned (`/success-stories`, `/lessons-learned`)
   - GeoSites & GIS mapping (`/geo-sites`)
   - Reports & exports (`/reports`, `/export`)
   - AI Insights proxy (`/ai/generate-insights`)
2. **Missing Pagination & Filtering**:
   - `getProjects`, `getDataPoints`, `getAuditLogs` lack `page`, `limit`, `startDate`, `endDate`, and `status` query parameters.
3. **Missing Offline Sync Queue**:
   - Does not have a local queue mechanism to hold pending mutations when network is disconnected and retry with exponential backoff.
4. **Transport Error Normalization**:
   - Needs structured error envelope `{ success: false, error: { code: string, message: string, details?: any } }`.

---

## 5. Migration & Relational Schema Mapping (PostgreSQL / Supabase)

### Table Mapping:
- `meal_organisations` $\rightarrow$ `public.organisations`
- `meal_users` $\rightarrow$ `auth.users` + `public.user_profiles`
- `me_tracker_projects_list` $\rightarrow$ `public.projects`
- `me_tracker_indicators` $\rightarrow$ `public.indicators`
- `me_tracker_data_points` $\rightarrow$ `public.data_points`
- `me_tracker_toc` $\rightarrow$ `public.theories_of_change`
- `me_tracker_logframe` $\rightarrow$ `public.logical_frameworks`
- `me_tracker_results_chain` $\rightarrow$ `public.results_chains`
- `meal_collection_forms` $\rightarrow$ `public.collection_forms`
- `meal_form_submissions` $\rightarrow$ `public.form_submissions`
- `meal_risk_register` $\rightarrow$ `public.risk_items`
- `meal_accountability_complaints` $\rightarrow$ `public.safeguarding_complaints`
- `meal_evaluations` $\rightarrow$ `public.evaluations`
- `me_tracker_success_stories` $\rightarrow$ `public.success_stories`
- `me_tracker_lessons_learned` $\rightarrow$ `public.lessons_learned`
- `meal_geo_sites` $\rightarrow$ `public.geo_sites`
- `meal_reports` $\rightarrow$ `public.meal_reports`
- `meal_audit_logs` $\rightarrow$ `public.audit_logs` (Append-only table, RLS inserts only via trigger or service role)

### Handling Demonstration Data:
- The existing codebase contains demo seed objects (`org_community_action`, `INSTITUTIONAL_USERS`, `SAMPLE_INDICATORS`, `SEED_FORMS`).
- These should be marked with `is_demo: true` in PostgreSQL so they can be filtered out of production analytics and donor audits without breaking local preview capabilities.

---

## 6. Security & Vulnerability Analysis (Current vs Target)

| Security Control | Current Client Implementation | Vulnerability / Risk | Production Backend Requirement |
| :--- | :--- | :--- | :--- |
| **Persona Switching** | Top bar `<select>` updates React state | Any user can switch to Admin in browser DOM | Real session JWT with cryptographically signed role claim |
| **Organisation Scoping** | Stored in `localStorage` | Changing `activeOrgId` lets user see cached data | PostgreSQL RLS: `WHERE organisation_id = auth.jwt() ->> 'org_id'` |
| **Anti-Self-Approval** | Checked in `accessControl.canApproveSubmission()` | Bypassable by modifying client JS | Backend database constraint or trigger rejecting self-approval |
| **Safeguarding Privacy** | Screen filters `isSafeguardingSensitive` in React | Raw complaint payloads accessible in network response | Separate database schema or table with restricted RLS policies |
| **Audit Immutability** | Local array prepend | User can clear `localStorage` | Write-only audit table with no `UPDATE` or `DELETE` grants |

---

## 7. Recommended Phased Integration Order

1. **Phase 1: Database Schema & Supabase RLS Provisioning**
   - Create tables, foreign keys, enums, and row-level security policies.
   - Install anti-self-approval trigger on `form_submissions`.
2. **Phase 2: Authentication & Multi-Tenant Context**
   - Implement Supabase Auth / JWT login.
   - Wire `apiClient.ts` with token refresh and automatic `X-Organisation-ID` header.
3. **Phase 3: Core Project & Indicator Sync**
   - Connect Projects, Indicators, and Data Points.
   - Validate indicator progress calculation engine against Vitest suite.
4. **Phase 4: Field Data Ingestion & 2-Step Verification**
   - Connect Form Builder, Mobile Submissions queue, and Verifier actions.
5. **Phase 5: Governance, Safeguarding & Audit Ledger**
   - Connect Safeguarding complaints with role-partitioned access.
   - Connect append-only audit trail logging.
6. **Phase 6: AI Insights & Reporting Engine**
   - Deploy server-side AI proxy for Gemini queries.
   - Connect PDF/Excel report generators.

---

## 8. Exact Frontend Files Requiring Changes During Integration

1. `/services/apiClient.ts`: Expand endpoint coverage, add query filtering, and structured error responses.
2. `/services/mealStorage.ts`: Transform into an offline-first caching layer that syncs with `apiClient`.
3. `/services/authService.ts`: Replace simulated persona sessions with real Supabase Auth JWT sessions.
4. `/App.tsx`: Replace local state initializers with queries to `apiClient` / React Query.
5. `components/features/FormSubmissionsView.tsx`: Point verification and rejection handlers directly to backend API.
6. `components/features/AIInsightsView.tsx`: Replace client-side Gemini call with server proxy `/api/v1/ai/generate-insights`.
