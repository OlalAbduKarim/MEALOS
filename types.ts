import type React from 'react';

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  organisationId?: string;
  code?: string;
  sector?: string;
  location?: string;
  budget?: number;
  currency?: string;
  status?: 'Planning' | 'Active' | 'Under Review' | 'Completed' | 'Archived';
  managerName?: string;
}

export enum IndicatorDataType {
  Numeric = "Numeric",
  Percentage = "Percentage",
  Text = "Text",
}

export enum AggregationType {
  NONE = "None",
  SUM = "Sum",
  AVERAGE = "Average",
  COUNT = "Count",
  LATEST = "Latest",
}

export enum IndicatorStatus {
  ON_TRACK = "On Track",
  AT_RISK = "At Risk",
  OFF_TRACK = "Off Track",
  NO_DATA = "No Data",
  NOT_APPLICABLE = "N/A" // For text indicators or where progress isn't relevant
}

export interface StatusThresholds {
  offTrackLessThan: number; // e.g., 70 (anything less than this is off track)
  atRiskLessThan: number;   // e.g., 90 (anything less than this but >= offTrack is at risk)
}

export interface Indicator {
  id: string; // auto-generated
  projectId: string;
  code?: string;
  name: string;
  description: string;
  unitOfMeasure: string;
  dataType: IndicatorDataType;
  targetValue: number | string;
  baselineValue?: number | string;
  baselineDate?: string;
  directionality?: 'higher_is_better' | 'lower_is_better' | 'target_range';
  sector?: string;
  frequency?: string;
  responsibleOfficer?: string;
  
  calculationFormula?: string; 
  aggregationType?: AggregationType; 
  dependsOnIndicatorIds?: string[]; 
  disaggregationCategories?: string[]; 
  
  minValue?: number;
  maxValue?: number;
  targetRangeMin?: number;
  targetRangeMax?: number;
  targetPeriod?: 'monthly' | 'quarterly' | 'annual' | 'cumulative' | 'life_of_project';

  statusThresholds?: StatusThresholds;
}

export interface DataPoint {
  id: string; // auto-generated
  indicatorId: string;
  actualValue: number | string;
  collectionDate: string;
  notes?: string;
  tags?: Record<string, string | number>;
  verificationStatus?: 'draft' | 'under_review' | 'verified' | 'rejected';
  verifiedBy?: string;
  submissionId?: string;
  numerator?: number;
  denominator?: number;
  disaggregatedValues?: Record<string, number>;
  syncStatus?: 'synced' | 'queued' | 'sync_failed';
  offlineCreated?: boolean;
}

export interface SuccessStory {
  id: string;
  projectId: string;
  title: string;
  narrative: string;
  dateAdded: string;
  // Optional fields: tags?: string[]; relatedIndicatorIds?: string[]; imageUrl?: string;
}

export interface LessonLearned {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: 'Positive' | 'Negative' | 'Neutral' | 'Observation' | 'Recommendation';
  dateDocumented: string;
  // Optional fields: tags?: string[]; relatedIndicatorIds?: string[]; responsiblePerson?: string; status?: 'Open' | 'Addressed' | 'Closed';
}

export type ModalType = 
  | 'ADD_INDICATOR' 
  | 'EDIT_INDICATOR' 
  | 'ADD_DATA_POINT' 
  | 'CREATE_PROJECT'
  | 'EDIT_PROJECT_DETAILS'
  | 'ADD_SUCCESS_STORY'
  | 'EDIT_SUCCESS_STORY'
  | 'ADD_LESSON_LEARNED'
  | 'EDIT_LESSON_LEARNED';

export interface ModalDataAddDataPoint {
  indicator: Indicator; 
}

export interface ModalDataSuccessStory {
  story?: SuccessStory; // For editing
  projectId: string;
}

export interface ModalDataLessonLearned {
  lesson?: LessonLearned; // For editing
  projectId: string;
}


export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data?: Indicator | Project | ModalDataAddDataPoint | ModalDataSuccessStory | ModalDataLessonLearned | any; 
}

export interface Option {
  value: string | number;
  label:string;
}

// Ribbon Types
export type RibbonTabId = 
  | 'home' 
  | 'project_home'
  | 'frameworks' 
  | 'data_management' 
  | 'analysis_reporting' 
  | 'learning_collaboration' 
  | 'task_project_management' 
  | 'admin';

export type FeatureViewType =
  | 'indicator_dashboard' 
  | 'logframe_designer'
  | 'toc_designer'
  | 'results_framework_designer'
  | 'indicator_library' 
  | 'pirs_templates' 
  | 'indicator_version_control'
  | 'form_builder'
  | 'manage_forms'
  | 'form_templates' 
  | 'mobile_app_sync' 
  | 'import_data'
  | 'export_data' 
  | 'data_cleaning_tools' 
  | 'qualitative_documents'
  | 'qualitative_analysis'
  | 'indicator_tracking_table' 
  | 'view_dashboards'
  | 'edit_dashboards'
  | 'multi_project_dashboard' 
  | 'export_visuals' 
  | 'advanced_analytics_tools' 
  | 'ai_insights' 
  | 'generate_report'
  | 'report_templates' 
  | 'scheduled_reports'
  | 'project_map' 
  | 'map_layers' 
  | 'success_stories_repo' 
  | 'lessons_learned_tracker' 
  | 'recommendations_matrix' 
  | 'stakeholder_meetings' 
  | 'manage_users'
  | 'manage_roles'
  | 'my_tasks'
  | 'project_tasks' 
  | 'workflow_designer'
  | 'project_comments' 
  | 'share_center' 
  | 'notifications_config' 
  | 'task_manager_integrations' 
  | 'api_management' 
  | 'audit_trail' 
  | 'webhook_config'
  | 'backup_recovery_tools' 
  | 'localization_settings' 
  | 'external_system_integrations'
  | 'evaluation_management'
  | 'accountability_safeguarding'
  | 'risk_register'
  | 'form_submissions';


export interface RibbonButtonConfig {
  id: string;
  label: string;
  icon?: React.ReactElement<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export interface RibbonGroupConfig {
  id: string;
  title: string;
  buttons: RibbonButtonConfig[];
}

export interface RibbonTabConfig {
  id: RibbonTabId;
  title: string;
  groups: RibbonGroupConfig[];
  icon?: React.ReactElement<{ className?: string }>;
}

export interface ProjectWithIndicators extends Project {
  indicators: Indicator[];
}

// M&E Framework Data Types
export interface TheoryOfChangeFramework {
  id?: string; // Firestore document ID
  projectId: string;
  inputs: string; // Text block, items separated by newlines
  activities: string;
  outputs: string;
  outcomes: string;
  impact: string;
  assumptions?: string; 
  lastUpdated: string; // ISO date string
}

export interface LogFrameFramework {
  id?: string; // Firestore document ID
  projectId: string;
  goal: string;
  outcomes: string; 
  outputs: string;
  activities: string;
  goalIndicators: string;
  outcomeIndicators: string;
  outputIndicators: string;
  activityIndicators?: string; 
  goalMov: string; 
  outcomeMov: string;
  outputMov: string;
  activityMov?: string;
  goalAssumptions: string;
  outcomeAssumptions: string;
  outputAssumptions: string;
  activityAssumptions?: string;
  lastUpdated: string; // ISO date string
}

export interface ResultsChainFramework {
  id?: string; // Firestore document ID
  projectId: string;
  inputs: string;
  activities: string;
  outputs: string;
  shortTermOutcomes: string; 
  mediumTermOutcomes: string;
  longTermImpact: string; 
  lastUpdated: string; // ISO date string
}

export type FrameworkTemplateType = 'toc' | 'logframe' | 'results_chain';


// PIRS Template Types
export interface PirsField {
  id: string; // e.g., 'indicator_name', 'definition', 'baseline_value'
  label: string; // User-friendly label, e.g., "Indicator Name"
  placeholder?: string; // Placeholder text for input fields
  description?: string; // Guidance or explanation for the field
  fieldType: 'text' | 'textarea' | 'number' | 'date' | 'select'; // Type of input
  options?: Option[]; // For select type
  required?: boolean;
}

export interface PirsTemplate {
  id: string; // Unique ID for the template
  name: string; // Template name, e.g., "Standard Output Indicator PIRS"
  description: string; // Brief description of the template's purpose
  category: string; // e.g., "Output Indicators", "Outcome Indicators", "Process Indicators"
  fields: PirsField[];
}

// --- NEW MEAL DOMAIN MODELS ---

export interface Organisation {
  id: string;
  name: string;
  code: string;
  sector: string;
  country: string;
  currency: string;
  dateFormat: string;
  createdAt: string;
  logoUrl?: string;
  isDemo?: boolean;
}

export type UserRole = 
  | 'platform_admin' 
  | 'org_admin' 
  | 'project_manager' 
  | 'meal_officer' 
  | 'enumerator' 
  | 'reviewer' 
  | 'analyst' 
  | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organisationId: string;
  activeProjectIds: string[];
}

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'gps' 
  | 'photo' 
  | 'calculated';

export interface FormField {
  id: string;
  label: string;
  fieldType: FormFieldType;
  required: boolean;
  options?: string[]; // for select, radio, checkbox
  placeholder?: string;
  helpText?: string;
  minValue?: number;
  maxValue?: number;
  mappedIndicatorId?: string; // Links this field directly to an indicator
}

export interface CollectionForm {
  id: string;
  projectId: string;
  title: string;
  description: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  fields: FormField[];
  createdAt: string;
  publishedAt?: string;
  targetSubmissions?: number;
}

export interface FormSubmission {
  id: string;
  formId: string;
  projectId: string;
  enumeratorId: string;
  enumeratorName: string;
  submissionDate: string;
  data: Record<string, any>;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'returned';
  reviewNotes?: string;
  reviewerName?: string;
  approvedAt?: string;
  gpsLocation?: { latitude: number; longitude: number; accuracy?: number };
}

export interface DataQualityIssue {
  id: string;
  recordId: string;
  indicatorId?: string;
  field: string;
  value: any;
  severity: 'warning' | 'error';
  message: string;
  checkType: 'outlier' | 'missing' | 'duplicate' | 'range';
  status: 'flagged' | 'corrected' | 'approved';
  correctedValue?: any;
  justification?: string;
  timestamp: string;
}

export interface RiskItem {
  id: string;
  projectId: string;
  title: string;
  category: 'Financial' | 'Operational' | 'Security' | 'Contextual' | 'Environmental' | 'Safeguarding';
  likelihood: number; // 1-5
  impact: number;     // 1-5
  rating: number;     // likelihood * impact
  earlyWarningIndicator?: string;
  mitigation: string;
  owner: string;
  status: 'active' | 'mitigated' | 'closed';
  reviewDate: string;
}

export interface AccountabilityComplaint {
  id: string;
  projectId: string;
  referenceCode: string;
  category: 'Service Delivery' | 'Staff Conduct' | 'Fraud/Corruption' | 'Safeguarding' | 'Feedback';
  channel: 'Helpline' | 'Suggestion Box' | 'Community Meeting' | 'Digital Portal';
  isAnonymous: boolean;
  complainantName?: string;
  complainantContact?: string;
  description: string;
  isSafeguardingSensitive: boolean;
  status: 'received' | 'under_investigation' | 'resolved' | 'closed';
  assignedTo: string;
  dateReceived: string;
  resolutionSummary?: string;
  resolvedAt?: string;
}

export interface Evaluation {
  id: string;
  projectId: string;
  title: string;
  type: 'baseline' | 'midterm' | 'endline' | 'impact' | 'thematic';
  status: 'planned' | 'in_progress' | 'completed';
  leadEvaluator: string;
  budget?: number;
  criteria: string[]; // OECD DAC: Relevance, Coherence, Effectiveness, Efficiency, Impact, Sustainability
  keyFindings: string;
  recommendations: string[];
  startDate: string;
  endDate: string;
  reportUrl?: string;
}

export interface MealReport {
  id: string;
  projectId: string;
  title: string;
  reportType: 'monthly' | 'quarterly' | 'annual' | 'donor' | 'custom';
  reportingPeriod: string;
  executiveSummary: string;
  indicatorSnapshots: Array<{
    indicatorId: string;
    indicatorName: string;
    targetValue: string | number;
    actualValue: string | number;
    achievementPct: number;
    status: IndicatorStatus;
  }>;
  findings: string;
  status: 'draft' | 'approved';
  approvedBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organisationId: string;
  projectId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface GeoSite {
  id: string;
  projectId: string;
  name: string;
  type: 'health_facility' | 'school' | 'community_center' | 'water_point' | 'distribution_hub';
  district: string;
  latitude: number;
  longitude: number;
  beneficiariesTargeted: number;
  indicatorsMeasured: string[];
}

