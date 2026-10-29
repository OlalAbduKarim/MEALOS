import { 
  Organisation, UserProfile, UserRole, Project, Indicator, DataPoint, 
  CollectionForm, FormSubmission, RiskItem, AccountabilityComplaint, 
  Evaluation, MealReport, AuditLog, GeoSite, SuccessStory, LessonLearned,
  IndicatorDataType, TheoryOfChangeFramework, LogFrameFramework, ResultsChainFramework
} from '../types';

const STORAGE_KEYS = {
  ORGANISATIONS: 'meal_organisations',
  CURRENT_ORG_ID: 'meal_current_org_id',
  CURRENT_ROLE: 'meal_current_role',
  PROJECTS: 'me_tracker_projects_list',
  INDICATORS: 'me_tracker_indicators',
  DATA_POINTS: 'me_tracker_data_points',
  FORMS: 'meal_collection_forms',
  SUBMISSIONS: 'meal_form_submissions',
  RISKS: 'meal_risk_register',
  COMPLAINTS: 'meal_accountability_complaints',
  EVALUATIONS: 'meal_evaluations',
  REPORTS: 'meal_reports',
  AUDIT_LOGS: 'meal_audit_logs',
  GEO_SITES: 'meal_geo_sites',
  SUCCESS_STORIES: 'me_tracker_success_stories',
  LESSONS_LEARNED: 'me_tracker_lessons_learned',
  THEORY_OF_CHANGE: 'me_tracker_toc',
  LOGFRAME: 'me_tracker_logframe',
  RESULTS_CHAIN: 'me_tracker_results_chain'
};

// Initial Seed Organisations
export const DEFAULT_ORGANISATIONS: Organisation[] = [
  {
    id: 'org_gh_health',
    name: 'Global Health & Education Alliance (GHEA)',
    code: 'GHEA',
    sector: 'Maternal Health, WASH & Primary Education',
    country: 'Uganda & East Africa',
    currency: 'USD ($)',
    dateFormat: 'YYYY-MM-DD',
    createdAt: '2023-01-10T08:00:00Z',
    isDemo: false
  },
  {
    id: 'org_community_action',
    name: 'Save Communities International',
    code: 'SCI',
    sector: 'Food Security, Climate Resilience & Livelihoods',
    country: 'Sub-Saharan Africa',
    currency: 'EUR (€)',
    dateFormat: 'DD/MM/YYYY',
    createdAt: '2023-06-15T09:30:00Z',
    isDemo: true
  }
];

// Initial Seed Forms
export const SEED_FORMS: CollectionForm[] = [
  {
    id: 'form_mch_clinic_visit',
    projectId: 'proj_001',
    title: 'Maternal Clinic Monthly Facility Assessment',
    description: 'Routine monthly facility monitoring form for antenatal care (ANC) attendance, skilled delivery equipment, and trained midwife presence.',
    version: 1,
    status: 'published',
    createdAt: '2023-03-01T10:00:00Z',
    publishedAt: '2023-03-05T12:00:00Z',
    targetSubmissions: 50,
    fields: [
      { id: 'f_facility_name', label: 'Health Facility Name', fieldType: 'text', required: true, placeholder: 'e.g., Siyancoba Health Centre IV' },
      { id: 'f_district', label: 'District / Sub-County', fieldType: 'select', required: true, options: ['Central District', 'North Highlands', 'River Valley', 'East Coast'] },
      { id: 'f_assessment_date', label: 'Assessment Date', fieldType: 'date', required: true },
      { id: 'f_anc_visits', label: 'Number of Women Completing >= 4 ANC Visits This Month', fieldType: 'number', required: true, minValue: 0, helpText: 'Direct count from clinic ANC register' },
      { id: 'f_skilled_deliveries', label: 'Total Births Attended by Skilled Health Personnel', fieldType: 'number', required: true, minValue: 0 },
      { id: 'f_stockout', label: 'Any Essential MCH Drug Stockouts in the Last 30 Days?', fieldType: 'radio', required: true, options: ['No stockouts', 'Minor stockout (< 3 days)', 'Critical stockout (> 7 days)'] },
      { id: 'f_emonc_functional', label: 'Is Basic EmONC Equipment Fully Operational?', fieldType: 'select', required: true, options: ['Yes - Fully Operational', 'Partially Operational', 'Not Operational / Needs Repair'] },
      { id: 'f_enumerator_notes', label: 'Field Assessor Observations & Challenges', fieldType: 'textarea', required: false, placeholder: 'Note any logistics, staffing or transport constraints...' }
    ]
  },
  {
    id: 'form_chv_household',
    projectId: 'proj_001',
    title: 'Community Health Volunteer (CHV) Household Nutrition Survey',
    description: 'Rapid household nutrition and infant immunization verification conducted by active village health teams.',
    version: 1,
    status: 'published',
    createdAt: '2023-04-10T09:00:00Z',
    publishedAt: '2023-04-12T14:00:00Z',
    targetSubmissions: 120,
    fields: [
      { id: 'f_village', label: 'Village / Parish Name', fieldType: 'text', required: true },
      { id: 'f_household_head', label: 'Household Respondent Category', fieldType: 'select', required: true, options: ['Mother / Primary Female Caregiver', 'Father / Head of Household', 'Grandmother / Elderly Caregiver'] },
      { id: 'f_children_under_5', label: 'Number of Children Under 5 Years in Household', fieldType: 'number', required: true, minValue: 0 },
      { id: 'f_immunization_card', label: 'Immunization Card / Child Health Card Verified?', fieldType: 'radio', required: true, options: ['Yes - Verified on Card', 'Reported Yes - Card Unavailable', 'No / Defaulter'] },
      { id: 'f_exclusive_breastfeeding', label: 'Adopting Recommended Infant Feeding Practices?', fieldType: 'select', required: true, options: ['Yes', 'Partially', 'No'] },
      { id: 'f_chv_counseling_received', label: 'Received Home Counseling from CHV within Last Month?', fieldType: 'radio', required: true, options: ['Yes', 'No'] }
    ]
  }
];

// Initial Seed Submissions
export const SEED_SUBMISSIONS: FormSubmission[] = [
  {
    id: 'sub_001',
    formId: 'form_mch_clinic_visit',
    projectId: 'proj_001',
    enumeratorId: 'enum_grace',
    enumeratorName: 'Grace Auma (Senior Field Monitor)',
    submissionDate: '2024-03-14T11:30:00Z',
    status: 'approved',
    reviewNotes: 'Verified against clinic delivery ledger and signed by Facility In-Charge Dr. Okello.',
    reviewerName: 'David Ssemwogerere (MEAL Lead)',
    approvedAt: '2024-03-15T09:00:00Z',
    gpsLocation: { latitude: 0.3476, longitude: 32.5825, accuracy: 5.2 },
    data: {
      f_facility_name: 'Siyancoba Health Centre IV',
      f_district: 'Central District',
      f_assessment_date: '2024-03-14',
      f_anc_visits: 142,
      f_skilled_deliveries: 88,
      f_stockout: 'No stockouts',
      f_emonc_functional: 'Yes - Fully Operational',
      f_enumerator_notes: 'All cold chain fridges operational. Solar backup running smoothly.'
    }
  },
  {
    id: 'sub_002',
    formId: 'form_mch_clinic_visit',
    projectId: 'proj_001',
    enumeratorId: 'enum_peter',
    enumeratorName: 'Peter Mugisha (M&E Field Officer)',
    submissionDate: '2024-03-20T15:45:00Z',
    status: 'under_review',
    reviewNotes: 'Pending confirmation of stockout duration for Oxytocin and Amoxicillin syrup.',
    gpsLocation: { latitude: 0.4201, longitude: 32.7112, accuracy: 8.1 },
    data: {
      f_facility_name: 'Bwindi Community Clinic',
      f_district: 'North Highlands',
      f_assessment_date: '2024-03-20',
      f_anc_visits: 95,
      f_skilled_deliveries: 45,
      f_stockout: 'Minor stockout (< 3 days)',
      f_emonc_functional: 'Partially Operational',
      f_enumerator_notes: 'Autoclave sterilization unit awaiting replacement fuse. Interim steam sterilizer active.'
    }
  }
];

// Initial Seed Risks
export const SEED_RISKS: RiskItem[] = [
  {
    id: 'risk_001',
    projectId: 'proj_001',
    title: 'Severe Rainy Season Road Inaccessibility to Remote Health Facilities',
    category: 'Contextual',
    likelihood: 4,
    impact: 4,
    rating: 16,
    earlyWarningIndicator: 'Weekly rainfall forecast > 100mm and district bridge status reports',
    mitigation: 'Pre-position emergency obstetric kits and motorbike ambulance fuel subsidies at sub-county level.',
    owner: 'Operations Manager & District Liaison Officer',
    status: 'active',
    reviewDate: '2024-04-15'
  },
  {
    id: 'risk_002',
    projectId: 'proj_001',
    title: 'Health Worker High Attrition Rate to Urban Referral Hospitals',
    category: 'Operational',
    likelihood: 3,
    impact: 4,
    rating: 12,
    earlyWarningIndicator: 'Monthly EmONC trained staff retention roster',
    mitigation: 'Advocate for district hardship allowances and conduct quarterly cascade refresher trainings for junior midwives.',
    owner: 'Capacity Building Coordinator',
    status: 'active',
    reviewDate: '2024-04-30'
  },
  {
    id: 'risk_003',
    projectId: 'proj_001',
    title: 'Delayed National Medical Stores (NMS) Essential Drug Distribution',
    category: 'Financial',
    likelihood: 3,
    impact: 3,
    rating: 9,
    earlyWarningIndicator: 'Quarterly facility requisition pipeline tracking',
    mitigation: 'Emergency buffer fund for supplementary procurement through joint medical store contracts.',
    owner: 'Procurement Specialist',
    status: 'active',
    reviewDate: '2024-05-10'
  }
];

// Initial Seed Accountability Complaints
export const SEED_COMPLAINTS: AccountabilityComplaint[] = [
  {
    id: 'comp_001',
    projectId: 'proj_001',
    referenceCode: 'COMP-2024-001',
    category: 'Service Delivery',
    channel: 'Suggestion Box',
    isAnonymous: true,
    description: 'Community members reported waiting over 4 hours for antenatal triage on Tuesday clinic days due to staff shortages.',
    isSafeguardingSensitive: false,
    status: 'resolved',
    assignedTo: 'Clinic Supervisor & MEAL Officer',
    dateReceived: '2024-02-12',
    resolutionSummary: 'Facility introduced staggered appointment times and added 2 rotating triage nurses on peak Tuesdays.',
    resolvedAt: '2024-02-28'
  },
  {
    id: 'comp_002',
    projectId: 'proj_001',
    referenceCode: 'COMP-2024-002',
    category: 'Safeguarding',
    channel: 'Helpline',
    isAnonymous: true,
    description: 'Confidential sensitive report alleging inappropriate conduct by transport contractor toward beneficiaries during maternal voucher transfer.',
    isSafeguardingSensitive: true,
    status: 'under_investigation',
    assignedTo: 'Lead Safeguarding Officer & Legal Counsel',
    dateReceived: '2024-03-08'
  },
  {
    id: 'comp_003',
    projectId: 'proj_001',
    referenceCode: 'COMP-2024-003',
    category: 'Feedback',
    channel: 'Community Meeting',
    isAnonymous: false,
    complainantName: 'Sarah Nalubega (Village Health Committee Chair)',
    complainantContact: '+256 772 123456',
    description: 'Request for nutrition counseling demonstrations to include local culturally available millet flour and sweet potatoes.',
    isSafeguardingSensitive: false,
    status: 'resolved',
    assignedTo: 'Nutrition Team Lead',
    dateReceived: '2024-03-18',
    resolutionSummary: 'Integrated local indigenous crop cooking demos into the April-June community module.',
    resolvedAt: '2024-03-24'
  }
];

// Initial Seed Evaluations (OECD-DAC Framework)
export const SEED_EVALUATIONS: Evaluation[] = [
  {
    id: 'eval_001',
    projectId: 'proj_001',
    title: 'Mid-Term Evaluation: Maternal & Child Health System Strengthening',
    type: 'midterm',
    status: 'completed',
    leadEvaluator: 'Dr. Evelyn Nabawanuka (Independent Evaluation Specialist)',
    budget: 45000,
    criteria: ['Relevance', 'Effectiveness', 'Efficiency', 'Sustainability'],
    startDate: '2024-01-10',
    endDate: '2024-03-15',
    keyFindings: 'Programme is highly relevant to district health priorities. Skilled birth attendance increased from 52% baseline to 71% (achieving 94% of mid-term milestone). Main bottleneck is persistent stockouts of clean delivery kits during heavy flood months.',
    recommendations: [
      'Scale up Village Health Team referral incentives to reach remote border communities.',
      'Strengthen district cold-chain solar maintenance protocols before next rainy cycle.',
      'Transition CHV performance monitoring from paper ledgers to digital mobile sync.'
    ]
  },
  {
    id: 'eval_002',
    projectId: 'proj_001',
    title: 'Comprehensive Baseline Survey: Maternal Mortality & Newborn Care Indicators',
    type: 'baseline',
    status: 'completed',
    leadEvaluator: 'Makerere School of Public Health Research Consortium',
    budget: 62000,
    criteria: ['Relevance', 'Coherence', 'Effectiveness'],
    startDate: '2023-01-20',
    endDate: '2023-04-10',
    keyFindings: 'Established verified baseline indicators across 25 district health centers and 3,200 households. Documented baseline maternal mortality ratio at 368 per 100,000 live births and 4-visit ANC attendance at 48%.',
    recommendations: [
      'Focus facility upgrade grants on EmONC Tier-1 high volume facilities first.',
      'Standardize disaggregation categories by adolescent mothers (< 19 years).'
    ]
  }
];

// Initial Seed Geo Sites
export const SEED_GEO_SITES: GeoSite[] = [
  { id: 'site_1', projectId: 'proj_001', name: 'Siyancoba Health Centre IV', type: 'health_facility', district: 'Central District', latitude: 0.3476, longitude: 32.5825, beneficiariesTargeted: 24000, indicatorsMeasured: ['ANC Attendance', 'Skilled Deliveries', 'EmONC Upgrades'] },
  { id: 'site_2', projectId: 'proj_001', name: 'Bwindi Community Clinic', type: 'health_facility', district: 'North Highlands', latitude: 0.4201, longitude: 32.7112, beneficiariesTargeted: 16500, indicatorsMeasured: ['ANC Attendance', 'CHV Household Visits'] },
  { id: 'site_3', projectId: 'proj_001', name: 'Kibale Valley Health Center III', type: 'health_facility', district: 'River Valley', latitude: 0.2815, longitude: 32.4920, beneficiariesTargeted: 18200, indicatorsMeasured: ['Skilled Deliveries', 'Immunization Coverage'] },
  { id: 'site_4', projectId: 'proj_001', name: 'Lake Shore Primary Care Hub', type: 'health_facility', district: 'East Coast', latitude: 0.2100, longitude: 32.6500, beneficiariesTargeted: 29000, indicatorsMeasured: ['ANC Attendance', 'Nutrition Screenings'] }
];

export const SEED_REPORTS: MealReport[] = [
  {
    id: 'rep_001',
    projectId: 'proj_001',
    title: 'Quarterly MEAL Indicator Performance Report - Q1 2024',
    reportType: 'quarterly',
    reportingPeriod: '2024-Q1 (Jan - Mar 2024)',
    executiveSummary: 'During Q1 2024, the Community Health Improvement Program demonstrated robust performance across core maternal and child survival indicators. Antenatal care (ANC 4+) attendance reached 78% against the 80% annual target (On Track). 150 health facility workers completed certified Emergency Obstetric Care training, exceeding the quarterly target by 12%.',
    indicatorSnapshots: [
      { indicatorId: 'ind_anc_01', indicatorName: 'Proportion of Pregnant Women Completing >= 4 ANC Visits', targetValue: 80, actualValue: 78, achievementPct: 97.5, status: 'On Track' as any },
      { indicatorId: 'ind_birth_02', indicatorName: 'Percentage of Births Attended by Skilled Health Personnel', targetValue: 75, actualValue: 71, achievementPct: 94.7, status: 'On Track' as any },
      { indicatorId: 'ind_train_03', indicatorName: 'Health Workers Trained in Emergency Obstetric Care (EmONC)', targetValue: 150, actualValue: 154, achievementPct: 102.7, status: 'On Track' as any }
    ],
    findings: 'Key enablers included regular supportive supervision of community health volunteers and solar lighting upgrades in labor wards. Recommendations focus on addressing seasonal road transport barriers for emergency referrals.',
    status: 'approved',
    approvedBy: 'Regional Director of Programmes & MEAL Lead',
    createdAt: '2024-03-31T16:00:00Z'
  }
];

class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const memoryStorage = new MemoryStorage();
export const getSafeStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch (e) {
    // Ignore and fallback
  }
  return memoryStorage;
};

class MealStorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const storage = getSafeStorage();
      const item = storage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch (e) {
      console.warn(`Error reading key ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      const storage = getSafeStorage();
      storage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error writing key ${key} to storage:`, e);
    }
  }

  // Organisations
  getOrganisations(): Organisation[] {
    return this.get<Organisation[]>(STORAGE_KEYS.ORGANISATIONS, []);
  }

  saveOrganisation(org: Organisation): void {
    const orgs = this.getOrganisations();
    const existingIndex = orgs.findIndex(o => o.id === org.id);
    if (existingIndex >= 0) {
      orgs[existingIndex] = org;
    } else {
      orgs.push(org);
    }
    this.set(STORAGE_KEYS.ORGANISATIONS, orgs);
    this.logAudit(org.id, undefined, 'Organisation Configured', 'Organisation', org.id, `Saved organization ${org.name}`);
  }

  getActiveOrganisationId(): string {
    const storage = getSafeStorage();
    const saved = storage.getItem(STORAGE_KEYS.CURRENT_ORG_ID);
    if (saved) return saved;
    const orgs = this.getOrganisations();
    const defaultId = orgs[0]?.id || '';
    if (defaultId) {
      this.setActiveOrganisationId(defaultId);
    }
    return defaultId;
  }

  setActiveOrganisationId(orgId: string): void {
    const storage = getSafeStorage();
    storage.setItem(STORAGE_KEYS.CURRENT_ORG_ID, orgId);
  }

  // Role persona switcher
  getActiveRole(): UserRole {
    const storage = getSafeStorage();
    return (storage.getItem(STORAGE_KEYS.CURRENT_ROLE) as UserRole) || 'meal_officer';
  }

  setActiveRole(role: UserRole): void {
    const storage = getSafeStorage();
    storage.setItem(STORAGE_KEYS.CURRENT_ROLE, role);
  }

  // Projects
  getProjects(organisationId?: string): Project[] {
    const orgId = organisationId || this.getActiveOrganisationId();
    const projects = this.get<Project[]>(STORAGE_KEYS.PROJECTS, []);
    return orgId ? projects.filter(p => !p.organisationId || p.organisationId === orgId) : projects;
  }

  saveProject(project: Project): void {
    const projects = this.get<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = project;
    } else {
      projects.unshift(project);
    }
    this.set(STORAGE_KEYS.PROJECTS, projects);
    this.logAudit(project.organisationId || this.getActiveOrganisationId(), project.id, 'Project Saved', 'Project', project.id, `Saved project ${project.name}`);
  }

  deleteProject(projectId: string): void {
    const projects = this.get<Project[]>(STORAGE_KEYS.PROJECTS, []).filter(p => p.id !== projectId);
    this.set(STORAGE_KEYS.PROJECTS, projects);
    const indicators = this.get<Indicator[]>(STORAGE_KEYS.INDICATORS, []).filter(i => i.projectId !== projectId);
    this.set(STORAGE_KEYS.INDICATORS, indicators);
    this.logAudit(this.getActiveOrganisationId(), projectId, 'Project Deleted', 'Project', projectId, 'Deleted project and associated records');
  }

  // Indicators
  getIndicators(projectId?: string): Indicator[] {
    const indicators = this.get<Indicator[]>(STORAGE_KEYS.INDICATORS, []);
    return projectId ? indicators.filter(i => i.projectId === projectId) : indicators;
  }

  saveIndicator(indicator: Indicator): void {
    const indicators = this.get<Indicator[]>(STORAGE_KEYS.INDICATORS, []);
    const idx = indicators.findIndex(i => i.id === indicator.id);
    if (idx >= 0) {
      indicators[idx] = indicator;
    } else {
      indicators.push(indicator);
    }
    this.set(STORAGE_KEYS.INDICATORS, indicators);
    this.logAudit(this.getActiveOrganisationId(), indicator.projectId, 'Indicator Saved', 'Indicator', indicator.id, `Saved indicator ${indicator.name}`);
  }

  deleteIndicator(indicatorId: string): void {
    const indicators = this.get<Indicator[]>(STORAGE_KEYS.INDICATORS, []).filter(i => i.id !== indicatorId);
    this.set(STORAGE_KEYS.INDICATORS, indicators);
    const dataPoints = this.get<DataPoint[]>(STORAGE_KEYS.DATA_POINTS, []).filter(d => d.indicatorId !== indicatorId);
    this.set(STORAGE_KEYS.DATA_POINTS, dataPoints);
    this.logAudit(this.getActiveOrganisationId(), undefined, 'Indicator Deleted', 'Indicator', indicatorId, 'Deleted indicator and related data points');
  }

  // Data Points
  getDataPoints(indicatorId?: string): DataPoint[] {
    const dataPoints = this.get<DataPoint[]>(STORAGE_KEYS.DATA_POINTS, []);
    return indicatorId ? dataPoints.filter(d => d.indicatorId === indicatorId) : dataPoints;
  }

  saveDataPoint(dataPoint: DataPoint): void {
    const dataPoints = this.get<DataPoint[]>(STORAGE_KEYS.DATA_POINTS, []);
    const idx = dataPoints.findIndex(d => d.id === dataPoint.id);
    if (idx >= 0) {
      dataPoints[idx] = dataPoint;
    } else {
      dataPoints.push(dataPoint);
    }
    this.set(STORAGE_KEYS.DATA_POINTS, dataPoints);
    this.logAudit(this.getActiveOrganisationId(), undefined, 'DataPoint Saved', 'DataPoint', dataPoint.id, `Value: ${dataPoint.actualValue}`);
  }

  deleteDataPoint(dataPointId: string): void {
    const dataPoints = this.get<DataPoint[]>(STORAGE_KEYS.DATA_POINTS, []).filter(d => d.id !== dataPointId);
    this.set(STORAGE_KEYS.DATA_POINTS, dataPoints);
    this.logAudit(this.getActiveOrganisationId(), undefined, 'DataPoint Deleted', 'DataPoint', dataPointId, 'Deleted data point');
  }

  // Forms
  getForms(projectId?: string): CollectionForm[] {
    const forms = this.get<CollectionForm[]>(STORAGE_KEYS.FORMS, []);
    return projectId ? forms.filter(f => f.projectId === projectId) : forms;
  }

  saveForm(form: CollectionForm): void {
    const forms = this.get<CollectionForm[]>(STORAGE_KEYS.FORMS, []);
    const existingIdx = forms.findIndex(f => f.id === form.id);
    if (existingIdx >= 0) {
      forms[existingIdx] = form;
    } else {
      forms.unshift(form);
    }
    this.set(STORAGE_KEYS.FORMS, forms);
    this.logAudit(this.getActiveOrganisationId(), form.projectId, 'Form Saved', 'CollectionForm', form.id, `Saved form ${form.title}`);
  }

  deleteForm(formId: string): void {
    const forms = this.getForms().filter(f => f.id !== formId);
    this.set(STORAGE_KEYS.FORMS, forms);
  }

  // Form Submissions
  getSubmissions(projectId?: string): FormSubmission[] {
    const submissions = this.get<FormSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    return projectId ? submissions.filter(s => s.projectId === projectId) : submissions;
  }

  saveSubmission(submission: FormSubmission): void {
    const submissions = this.get<FormSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const existingIdx = submissions.findIndex(s => s.id === submission.id);
    if (existingIdx >= 0) {
      submissions[existingIdx] = submission;
    } else {
      submissions.unshift(submission);
    }
    this.set(STORAGE_KEYS.SUBMISSIONS, submissions);
    this.logAudit(this.getActiveOrganisationId(), submission.projectId, 'Submission Recorded', 'FormSubmission', submission.id, `Status: ${submission.status}`);
  }

  updateSubmissionStatus(submissionId: string, status: FormSubmission['status'], reviewNotes?: string, reviewerName?: string): void {
    const submissions = this.getSubmissions();
    const sub = submissions.find(s => s.id === submissionId);
    if (sub) {
      sub.status = status;
      if (reviewNotes !== undefined) sub.reviewNotes = reviewNotes;
      if (reviewerName !== undefined) sub.reviewerName = reviewerName;
      if (status === 'approved') sub.approvedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.SUBMISSIONS, submissions);
      this.logAudit(this.getActiveOrganisationId(), sub.projectId, `Submission ${status.toUpperCase()}`, 'FormSubmission', sub.id, reviewNotes || `Review completed by ${reviewerName || 'Reviewer'}`);
    }
  }

  // Risks
  getRisks(projectId?: string): RiskItem[] {
    const risks = this.get<RiskItem[]>(STORAGE_KEYS.RISKS, []);
    return projectId ? risks.filter(r => r.projectId === projectId) : risks;
  }

  saveRisk(risk: RiskItem): void {
    const risks = this.get<RiskItem[]>(STORAGE_KEYS.RISKS, []);
    const idx = risks.findIndex(r => r.id === risk.id);
    if (idx >= 0) {
      risks[idx] = risk;
    } else {
      risks.unshift(risk);
    }
    this.set(STORAGE_KEYS.RISKS, risks);
    this.logAudit(this.getActiveOrganisationId(), risk.projectId, 'Risk Registered/Updated', 'RiskItem', risk.id, `${risk.title} (Rating: ${risk.rating})`);
  }

  deleteRisk(riskId: string): void {
    const risks = this.getRisks().filter(r => r.id !== riskId);
    this.set(STORAGE_KEYS.RISKS, risks);
  }

  // Accountability & Complaints
  getComplaints(projectId?: string): AccountabilityComplaint[] {
    const complaints = this.get<AccountabilityComplaint[]>(STORAGE_KEYS.COMPLAINTS, []);
    return projectId ? complaints.filter(c => c.projectId === projectId) : complaints;
  }

  saveComplaint(complaint: AccountabilityComplaint): void {
    const complaints = this.get<AccountabilityComplaint[]>(STORAGE_KEYS.COMPLAINTS, []);
    const idx = complaints.findIndex(c => c.id === complaint.id);
    if (idx >= 0) {
      complaints[idx] = complaint;
    } else {
      complaints.unshift(complaint);
    }
    this.set(STORAGE_KEYS.COMPLAINTS, complaints);
    this.logAudit(this.getActiveOrganisationId(), complaint.projectId, 'Complaint Logged/Updated', 'AccountabilityComplaint', complaint.id, `Ref: ${complaint.referenceCode}`);
  }

  // Evaluations
  getEvaluations(projectId?: string): Evaluation[] {
    const evals = this.get<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    return projectId ? evals.filter(e => e.projectId === projectId) : evals;
  }

  saveEvaluation(evaluation: Evaluation): void {
    const evals = this.get<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const idx = evals.findIndex(e => e.id === evaluation.id);
    if (idx >= 0) {
      evals[idx] = evaluation;
    } else {
      evals.unshift(evaluation);
    }
    this.set(STORAGE_KEYS.EVALUATIONS, evals);
    this.logAudit(this.getActiveOrganisationId(), evaluation.projectId, 'Evaluation Recorded', 'Evaluation', evaluation.id, evaluation.title);
  }

  // Reports
  getReports(projectId?: string): MealReport[] {
    const reports = this.get<MealReport[]>(STORAGE_KEYS.REPORTS, []);
    return projectId ? reports.filter(r => r.projectId === projectId) : reports;
  }

  saveReport(report: MealReport): void {
    const reports = this.get<MealReport[]>(STORAGE_KEYS.REPORTS, []);
    const idx = reports.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      reports[idx] = report;
    } else {
      reports.unshift(report);
    }
    this.set(STORAGE_KEYS.REPORTS, reports);
    this.logAudit(this.getActiveOrganisationId(), report.projectId, 'MEAL Report Generated', 'MealReport', report.id, `${report.title} (${report.status})`);
  }

  // Geo Sites
  getGeoSites(projectId?: string): GeoSite[] {
    const sites = this.get<GeoSite[]>(STORAGE_KEYS.GEO_SITES, []);
    return projectId ? sites.filter(s => s.projectId === projectId) : sites;
  }

  // Audit Logs
  getAuditLogs(organisationId?: string, projectId?: string): AuditLog[] {
    const logs = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    return logs.filter(l => {
      if (organisationId && l.organisationId !== organisationId) return false;
      if (projectId && l.projectId && l.projectId !== projectId) return false;
      return true;
    });
  }

  logAudit(organisationId: string, projectId: string | undefined, action: string, entityType: string, entityId: string, details: string): void {
    const logs = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const newLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      organisationId,
      projectId,
      actorName: 'Active User',
      actorRole: this.getActiveRole(),
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep last 300 logs
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 300));
  }

  // Frameworks: Theory of Change, LogFrame, Results Chain
  getTheoryOfChange(projectId: string): TheoryOfChangeFramework | null {
    const list = this.get<TheoryOfChangeFramework[]>(STORAGE_KEYS.THEORY_OF_CHANGE, []);
    return list.find(t => t.projectId === projectId) || null;
  }

  saveTheoryOfChange(data: TheoryOfChangeFramework): void {
    const list = this.get<TheoryOfChangeFramework[]>(STORAGE_KEYS.THEORY_OF_CHANGE, []);
    const idx = list.findIndex(t => t.projectId === data.projectId);
    if (idx >= 0) {
      list[idx] = data;
    } else {
      list.push(data);
    }
    this.set(STORAGE_KEYS.THEORY_OF_CHANGE, list);
    this.logAudit(this.getActiveOrganisationId(), data.projectId, 'Updated Theory of Change', 'TheoryOfChange', data.id || 'toc', 'Saved ToC framework structure');
  }

  getLogFrame(projectId: string): LogFrameFramework | null {
    const list = this.get<LogFrameFramework[]>(STORAGE_KEYS.LOGFRAME, []);
    return list.find(l => l.projectId === projectId) || null;
  }

  saveLogFrame(data: LogFrameFramework): void {
    const list = this.get<LogFrameFramework[]>(STORAGE_KEYS.LOGFRAME, []);
    const idx = list.findIndex(l => l.projectId === data.projectId);
    if (idx >= 0) {
      list[idx] = data;
    } else {
      list.push(data);
    }
    this.set(STORAGE_KEYS.LOGFRAME, list);
    this.logAudit(this.getActiveOrganisationId(), data.projectId, 'Updated Logical Framework', 'LogFrame', data.id || 'logframe', 'Saved Logical Framework matrix');
  }

  getResultsChain(projectId: string): ResultsChainFramework | null {
    const list = this.get<ResultsChainFramework[]>(STORAGE_KEYS.RESULTS_CHAIN, []);
    return list.find(r => r.projectId === projectId) || null;
  }

  saveResultsChain(data: ResultsChainFramework): void {
    const list = this.get<ResultsChainFramework[]>(STORAGE_KEYS.RESULTS_CHAIN, []);
    const idx = list.findIndex(r => r.projectId === data.projectId);
    if (idx >= 0) {
      list[idx] = data;
    } else {
      list.push(data);
    }
    this.set(STORAGE_KEYS.RESULTS_CHAIN, list);
    this.logAudit(this.getActiveOrganisationId(), data.projectId, 'Updated Results Chain', 'ResultsChain', data.id || 'results_chain', 'Saved Results Chain hierarchy');
  }

  // Success Stories
  getSuccessStories(projectId?: string): SuccessStory[] {
    const stories = this.get<SuccessStory[]>(STORAGE_KEYS.SUCCESS_STORIES, []);
    return projectId ? stories.filter(s => s.projectId === projectId) : stories;
  }

  saveSuccessStory(story: SuccessStory): void {
    const stories = this.get<SuccessStory[]>(STORAGE_KEYS.SUCCESS_STORIES, []);
    const idx = stories.findIndex(s => s.id === story.id);
    if (idx >= 0) {
      stories[idx] = story;
    } else {
      stories.unshift(story);
    }
    this.set(STORAGE_KEYS.SUCCESS_STORIES, stories);
    this.logAudit(this.getActiveOrganisationId(), story.projectId, 'Success Story Saved', 'SuccessStory', story.id, story.title);
  }

  deleteSuccessStory(storyId: string): void {
    const stories = this.get<SuccessStory[]>(STORAGE_KEYS.SUCCESS_STORIES, []);
    const target = stories.find(s => s.id === storyId);
    this.set(STORAGE_KEYS.SUCCESS_STORIES, stories.filter(s => s.id !== storyId));
    if (target) {
      this.logAudit(this.getActiveOrganisationId(), target.projectId, 'Success Story Deleted', 'SuccessStory', storyId, target.title);
    }
  }

  // Lessons Learned
  getLessonsLearned(projectId?: string): LessonLearned[] {
    const lessons = this.get<LessonLearned[]>(STORAGE_KEYS.LESSONS_LEARNED, []);
    return projectId ? lessons.filter(l => l.projectId === projectId) : lessons;
  }

  saveLessonLearned(lesson: LessonLearned): void {
    const lessons = this.get<LessonLearned[]>(STORAGE_KEYS.LESSONS_LEARNED, []);
    const idx = lessons.findIndex(l => l.id === lesson.id);
    if (idx >= 0) {
      lessons[idx] = lesson;
    } else {
      lessons.unshift(lesson);
    }
    this.set(STORAGE_KEYS.LESSONS_LEARNED, lessons);
    this.logAudit(this.getActiveOrganisationId(), lesson.projectId, 'Lesson Learned Saved', 'LessonLearned', lesson.id, lesson.title);
  }

  deleteLessonLearned(lessonId: string): void {
    const lessons = this.get<LessonLearned[]>(STORAGE_KEYS.LESSONS_LEARNED, []);
    const target = lessons.find(l => l.id === lessonId);
    this.set(STORAGE_KEYS.LESSONS_LEARNED, lessons.filter(l => l.id !== lessonId));
    if (target) {
      this.logAudit(this.getActiveOrganisationId(), target.projectId, 'Lesson Learned Deleted', 'LessonLearned', lessonId, target.title);
    }
  }
}

export const mealStorage = new MealStorageService();
