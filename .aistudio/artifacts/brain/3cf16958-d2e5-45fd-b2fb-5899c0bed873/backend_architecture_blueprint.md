# MEAL INSIGHTS OS — COMPLETE BACKEND SPECIFICATION & ARCHITECTURAL BLUEPRINT

## 1. System Overview & Architecture Diagram
MEAL Insights OS is an enterprise Monitoring, Evaluation, Accountability, and Learning platform designed for multi-country NGOs, humanitarian organizations, and institutional donors (USAID, FCDO, EU, Global Fund).

```
                      ┌───────────────────────────────────────────────┐
                      │              MEAL INSIGHTS OS                 │
                      │               Client Layer                    │
                      │  (React 19 SPA + Microsoft Office Ribbon UI)  │
                      └──────────────────────┬────────────────────────┘
                                             │ HTTPS REST + WebSocket
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │            API Gateway / Reverse Proxy        │
                      │        (CORS, Rate Limiting, TLS, WAF)        │
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────▼────────────────────────┐
                      │            Authentication & RBAC              │
                      │  (JWT / OAuth2 / Anti-Self-Approval Engine)   │
                      └──────────────┬────────────────┬───────────────┘
                                     │                │
            ┌────────────────────────┴───────┐        │
            ▼                                ▼        ▼
┌─────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│     Core MEAL Engine    │     │  Safeguarding / FCM    │     │  Reporting & AI Proxy  │
│  - Projects & Orgs      │     │  - Strict Isolation    │     │  - Aggregations        │
│  - Indicator Engine     │     │  - Anonymous Ingestion │     │  - Audit Ledger        │
│  - Form & Sync Pipeline │     │  - Lead-Only Access    │     │  - Gemini Analysis     │
└───────────┬─────────────┘     └───────────┬────────────┘     └───────────┬────────────┘
            │                               │                              │
            └───────────────────────┬───────┴──────────────────────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────────┐
                      │   PostgreSQL / Cloud SQL      │
                      │   Relational Schema + JSONB   │
                      │   Row-Level Security (RLS)    │
                      └───────────────────────────────┘
```

---

## 2. All Entities That Require Backend Storage & Processing

| Domain Entity | Primary Key | Description | Relationships |
| :--- | :--- | :--- | :--- |
| **Organisations** | `id` (UUID) | Multi-tenant root entity with currency, country, and timezone. | 1:N with Projects, Users, Audit Logs |
| **Users & Profiles** | `id` (UUID) | System actors with assigned institutional roles. | N:1 with Organisations; N:M with Projects |
| **Projects** | `id` (UUID) | Interventions with donor codes, budgets, dates, and sector. | N:1 with Organisations; 1:N with Indicators, Forms, Risks |
| **Indicators** | `id` (UUID) | PMP/MEL matrix metrics with baseline, target, directionality, and formula. | N:1 with Projects; 1:N with DataPoints |
| **Data Points** | `id` (UUID) | Disaggregated metric measurements with numerators, denominators, and dates. | N:1 with Indicators; N:1 with GeoSites |
| **Theory of Change** | `id` (UUID) | Logic chain (Inputs -> Activities -> Outputs -> Outcomes -> Impact). | 1:1 with Projects |
| **Logical Frameworks** | `id` (UUID) | Standard 4x4 matrix (Goal, Outcomes, Outputs, Activities + MoVs & Assumptions). | 1:1 with Projects |
| **Results Chains** | `id` (UUID) | Causal pathway linking activities to intermediate and long-term results. | 1:1 with Projects |
| **Collection Forms** | `id` (UUID) | Schema-defined digital survey instruments (Kobo/ODK compatible). | N:1 with Projects; 1:N with Submissions |
| **Form Submissions** | `id` (UUID) | Raw field data submitted by enumerators, queued for 2-step verification. | N:1 with Collection Forms; 1:N with Data Points |
| **Safeguarding / FCM** | `id` (UUID) | Confidential accountability and whistleblowing complaints. | N:1 with Projects; Partitioned to Safeguarding Leads |
| **Risk Register** | `id` (UUID) | Risk matrices with likelihood (1-5), impact (1-5), and mitigation actions. | N:1 with Projects |
| **Evaluations** | `id` (UUID) | Baseline, Midterm, and Endline studies with DAC criteria scoring. | N:1 with Projects |
| **Success Stories** | `id` (UUID) | Qualitative narrative evidence with quotes, beneficiary info, and tags. | N:1 with Projects |
| **Lessons Learned** | `id` (UUID) | Institutional learning logs categorised by phase and operational recommendations. | N:1 with Projects |
| **Geo Sites** | `id` (UUID) | GPS coordinates of intervention clinics, boreholes, schools, and distribution sites. | N:1 with Projects |
| **MEAL Reports** | `id` (UUID) | Snapshot compilation of indicator progress, story narratives, and risks. | N:1 with Projects |
| **Audit Logs** | `id` (UUID) | Append-only tamper-evident ledger recording all state modifications. | N:1 with Organisations |

---

## 3. Complete REST API Endpoint Specification

### A. Authentication & Multitenancy
- `POST /api/v1/auth/login` — Authenticate email/password or OAuth; returns JWT and User profile.
- `GET /api/v1/auth/me` — Return current session user, assigned organisation, and project scopes.
- `POST /api/v1/auth/refresh` — Issue fresh access token using secure HTTP-only refresh cookie.
- `GET /api/v1/organisations` — List all organisations the user belongs to.
- `POST /api/v1/organisations/switch` — Switch active tenancy context; validates membership server-side.

### B. Project Management
- `GET /api/v1/projects` — Filter by `orgId`, `sector`, `status`. Donors see only assigned projects.
- `POST /api/v1/projects` — Create new project (Admin or MEAL Manager).
- `GET /api/v1/projects/:id` — Get full project profile.
- `PUT /api/v1/projects/:id` — Update project metadata, budget, or dates.
- `DELETE /api/v1/projects/:id` — Soft-delete project and cascade archive children.

### C. Indicator Engine & Calculations
- `GET /api/v1/indicators?projectId=:id` — List all indicators under a project with calculated progress.
- `POST /api/v1/indicators` — Create indicator (PIRS definition, formula, directionality, targets).
- `GET /api/v1/indicators/:id` — Get single indicator with time-series aggregates.
- `PUT /api/v1/indicators/:id` — Update indicator targets, baseline, or status thresholds.
- `DELETE /api/v1/indicators/:id` — Delete indicator (guarded: rejects if data points exist).
- `GET /api/v1/indicators/:id/aggregates` — Server-side calculation engine returning weighted progress %, trend slope, and disaggregation breakdowns.

### D. Data Points & Ingestion
- `GET /api/v1/data-points?indicatorId=:id` — List measurements, disaggregations, and collection sites.
- `POST /api/v1/data-points` — Ingest measurement. Validates verification status and non-zero denominators.
- `PUT /api/v1/data-points/:id` — Edit record (creates audit trail).
- `DELETE /api/v1/data-points/:id` — Delete data point.
- `POST /api/v1/data-points/bulk-import` — Ingest CSV/Excel records in batch with validation error logs.

### E. Digital Forms & Two-Step Verification Pipeline
- `GET /api/v1/forms?projectId=:id` — Retrieve active mobile/web survey forms.
- `POST /api/v1/forms` — Publish form with field definitions, validation constraints, and indicator mappings.
- `GET /api/v1/submissions?formId=:id&status=:status` — List submissions (draft, submitted, verified, rejected).
- `POST /api/v1/submissions` — Mobile offline batch upload.
- `POST /api/v1/submissions/:id/verify` — Approve submission and auto-generate linked Data Points. **Enforces Anti-Self-Approval** (enumerator cannot verify own submission).
- `POST /api/v1/submissions/:id/reject` — Reject with mandatory rationale notes sent back to enumerator.

### F. MEAL Frameworks (ToC, LogFrame, Results Chain)
- `GET /api/v1/frameworks/toc/:projectId` — Fetch Theory of Change narrative & node hierarchy.
- `POST /api/v1/frameworks/toc/:projectId` — Save or update Theory of Change.
- `GET /api/v1/frameworks/logframe/:projectId` — Fetch Logical Framework 4x4 matrix.
- `POST /api/v1/frameworks/logframe/:projectId` — Save or update Logical Framework.
- `GET /api/v1/frameworks/results-chain/:projectId` — Fetch Results Chain causal steps.
- `POST /api/v1/frameworks/results-chain/:projectId` — Save or update Results Chain.

### G. Safeguarding & Community Accountability (FCM)
- `GET /api/v1/complaints?projectId=:id` — **Strict access control**: Only `safeguarding_lead` or designated Org Admin can access. Redacts survivor identities.
- `POST /api/v1/complaints` — Public or field intake for grievances, whistleblowing, and sensitive reports.
- `PUT /api/v1/complaints/:id` — Update investigation status, immediate actions taken, and resolution.

### H. Risk Register & Evaluations
- `GET /api/v1/risks?projectId=:id` — Fetch risk matrix items with heat-map scores (`likelihood * impact`).
- `POST /api/v1/risks` — Register risk with mitigation owner.
- `GET /api/v1/evaluations?projectId=:id` — Fetch baseline/midterm/endline evaluations and DAC scores.
- `POST /api/v1/evaluations` — Save evaluation study report and executive recommendations.

### I. Knowledge Management (Stories & Lessons)
- `GET /api/v1/success-stories?projectId=:id` — Fetch qualitative human-interest stories.
- `POST /api/v1/success-stories` — Create story with quotes, photos, and consent declarations.
- `GET /api/v1/lessons-learned?projectId=:id` — Fetch organizational learning repository.
- `POST /api/v1/lessons-learned` — Log operational lesson and action plan.

### J. Auditing, Quality Checks & AI Proxy
- `GET /api/v1/audit-logs?orgId=:id` — Query immutable tamper-evident system logs.
- `POST /api/v1/ai/generate-insights` — Server-side proxy to Gemini API. Ingests indicator datasets and outputs predictive narrative summaries, statistical anomalies, and risk warnings without exposing API keys to the browser.
- `POST /api/v1/data-cleaning/detect-outliers` — Run statistical anomaly detection (Z-score > 2.5, Benford's Law compliance, duplicate GPS points).

---

## 4. End-to-End User Flows

### Flow 1: Field Ingestion to Indicator Progress
1. Field Enumerator opens Mobile App Sync / Form Submissions in offline mode.
2. Ingests household survey data (`numerator = 42, denominator = 50`).
3. Device reconnects to network; uploads submission payload to `POST /api/v1/submissions`.
4. Data Quality Verifier logs in, reviews submission in Form Submissions queue.
5. Verifier triggers `POST /api/v1/submissions/:id/verify`. Backend checks that `submission.enumeratorId !== verifier.id`.
6. Backend updates submission status to `Approved` and atomically inserts a `DataPoint` mapped to `IND-001`.
7. Indicator Engine recalculates cumulative progress: `(Baseline 52% -> Current 84% -> Target 80%)`. Status updates from `off_track` to `target_met`.
8. Audit log is emitted: `actor=Verifier, action="Approved Submission", entityId=dp_123`.

### Flow 2: Safeguarding Whistleblower Triage
1. Community member or enumerator submits sensitive grievance via `POST /api/v1/complaints` (anonymous flag = `true`).
2. Payload is encrypted at rest; accessible ONLY by users holding the role `safeguarding_lead`.
3. Standard MEAL Officers and Field Enumerators receive 403 Forbidden if querying `/api/v1/complaints`.
4. Safeguarding Lead updates status to `Under Investigation`, assigns secure case notes, and closes upon resolution.

---

## 5. Indicator Calculation Engine Rules
The backend calculation engine must strictly adhere to the following formulas:

1. **Higher is Better**:
   `Progress % = ((Current - Baseline) / (Target - Baseline)) * 100`
2. **Lower is Better** (e.g., Stunting, Mortality):
   `Progress % = ((Baseline - Current) / (Baseline - Target)) * 100`
3. **Percentages & Ratios**:
   - If denominator is 0: Return `0%` or `null` (never divide by zero or emit `NaN` / `Infinity`).
   - If `Current > Target` for higher-is-better: Clamp or report true percentage (e.g. `112%`) with status `target_met`.
4. **Status Thresholds**:
   - `target_met`: Progress >= 100%
   - `on_track`: Progress between 70% and 99%
   - `critical`: Progress between 40% and 69%
   - `off_track`: Progress < 40%
