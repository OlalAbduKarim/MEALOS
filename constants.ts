// Fix: Import React for JSX support (still needed for React.FC and other React APIs)
import React from 'react';
import { Project, StatusThresholds, TheoryOfChangeFramework, LogFrameFramework, ResultsChainFramework, PirsTemplate, PirsField } from './types';

export const INITIAL_PROJECT_SEED: Project = {
  id: 'proj_001',
  name: 'Community Health Improvement Program',
  description: 'A 3-year initiative to improve maternal and child health outcomes in the Siyancoba district through awareness campaigns, clinic upgrades, and health worker training.',
  startDate: '2023-01-15',
  endDate: '2025-12-31',
};

export const LOCAL_STORAGE_KEYS = {
  PROJECTS_LIST: 'me_tracker_projects_list', 
  INDICATORS: 'me_tracker_indicators',
  DATA_POINTS: 'me_tracker_data_points',
  SUCCESS_STORIES: 'me_tracker_success_stories',
  LESSONS_LEARNED: 'me_tracker_lessons_learned',
};

export const DEFAULT_STATUS_THRESHOLDS: StatusThresholds = {
  offTrackLessThan: 70,
  atRiskLessThan: 90,
};

// --- MOCK FRAMEWORK TEMPLATES ---
export const MOCK_TOC_TEMPLATE: Omit<TheoryOfChangeFramework, 'id' | 'projectId' | 'lastUpdated'> = {
  inputs: "Funding from Global Fund\nTechnical expertise from Health NGO\nCommunity health volunteers (CHVs)\nGovernment health facilities & staff",
  activities: "Train CHVs on maternal health\nConduct awareness campaigns on nutrition\nUpgrade clinic equipment for maternal care\nProvide regular supervision to CHVs",
  outputs: "Increased number of trained CHVs\nIncreased community awareness of nutrition\nImproved availability of maternal health services\nCHVs actively providing counseling",
  outcomes: "Improved health-seeking behavior for maternal care\nIncreased adoption of recommended nutritional practices\nEnhanced skills of health workers in maternal care",
  impact: "Reduced maternal mortality rates\nReduced child malnutrition rates in Siyancoba district",
  assumptions: "Community remains receptive to health interventions\nGovernment policies remain supportive\nNo major natural disasters disrupting services"
};

export const MOCK_LOGFRAME_TEMPLATE: Omit<LogFrameFramework, 'id' | 'projectId' | 'lastUpdated'> = {
  goal: "To contribute to the reduction of preventable maternal and child deaths in Siyancoba District.",
  goalIndicators: "Maternal Mortality Ratio (MMR) reduced by 20% by project end\nUnder-5 Child Mortality Rate (U5MR) reduced by 15% by project end",
  goalMov: "District Health Information System (DHIS2) records\nNational Demographic Health Survey (DHS) data",
  goalAssumptions: "Broader socio-economic conditions remain stable or improve\nNational health policies continue to support MCH.",
  
  outcomes: "Improved access to and utilization of quality maternal and child health (MCH) services by target communities.",
  outcomeIndicators: "Proportion of pregnant women attending at least 4 Antenatal Care (ANC) visits increased to 80%\nPercentage of births attended by skilled health personnel increased to 75%\nProportion of children fully immunized by age 1 increased to 90%",
  outcomeMov: "Clinic attendance registers\nHealth facility delivery records\nImmunization cards and registers",
  outcomeAssumptions: "Communities are willing to utilize available health services\nEssential drugs and supplies are consistently available.",

  outputs: "Enhanced capacity of health facilities and community structures to deliver MCH services.",
  outputIndicators: "Number of health workers trained in Emergency Obstetric and Newborn Care (EmONC): 150\nNumber of Community Health Volunteers (CHVs) trained and active: 300\nNumber of health facilities with essential MCH equipment and supplies: 25",
  outputMov: "Training reports and attendance lists\nCHV activity logs\nHealth facility inventory records",
  outputAssumptions: "Trained personnel remain in their posts\nCHVs are motivated and supported by the community.",

  activities: "Conduct EmONC training for health workers\nRecruit, train, and equip CHVs\nProcure and distribute MCH equipment and supplies to facilities\nConduct community awareness and mobilization campaigns.",
  activityIndicators: "Number of EmONC training sessions conducted: 10\nNumber of CHV training modules delivered: 5\nValue of MCH equipment procured: $50,000\nNumber of awareness campaigns held: 40",
  activityMov: "Workshop reports\nProcurement documents\nCampaign activity reports",
  activityAssumptions: "Training venues and materials are available\nLogistics for procurement and distribution function effectively."
};

export const MOCK_RESULTS_CHAIN_TEMPLATE: Omit<ResultsChainFramework, 'id' | 'projectId' | 'lastUpdated'> = {
  inputs: "Project budget: $500,000\nProject staff: 5 FTEs\nTraining curriculum for farmers\nPartnership with local agricultural extension office",
  activities: "Conduct farmer field schools on climate-smart agriculture\nEstablish demonstration plots for new crop varieties\nFacilitate access to micro-credit for agricultural inputs\nOrganize market linkage workshops",
  outputs: "500 farmers trained in climate-smart techniques\n20 demonstration plots established and maintained\n$50,000 in micro-credit disbursed to farmers\n4 market linkage workshops conducted with 100+ participants",
  shortTermOutcomes: "Increased farmer knowledge of climate-smart agriculture\nAdoption of new crop varieties by trained farmers\nIncreased use of improved agricultural inputs",
  mediumTermOutcomes: "Increased crop yields for participating farmers\nImproved household food security\nDiversification of income sources for farming families",
  longTermImpact: "Enhanced resilience of farming communities to climate change in the target region\nImproved livelihoods and economic status of smallholder farmers"
};


// --- MOCK PIRS TEMPLATES ---
const commonPirsFields: PirsField[] = [
  { id: 'indicator_name', label: '1. Indicator Name', fieldType: 'text', required: true, description: "The full, official name of the indicator." },
  { id: 'short_name', label: '2. Short Name/ID (Optional)', fieldType: 'text', description: "A brief code or acronym for the indicator, if applicable." },
  { id: 'project_objective', label: '3. Related Project Objective/Outcome', fieldType: 'textarea', required: true, description: "Which specific project objective, outcome, or output does this indicator measure progress towards?" },
  { id: 'description', label: '4. Description/Definition', fieldType: 'textarea', required: true, description: "Precise definition of what is being measured, including key terms." },
  { id: 'unit_of_measure', label: '5. Unit of Measurement', fieldType: 'text', required: true, placeholder: "e.g., Number, %, Ratio, Text" },
  { id: 'baseline_value', label: '6. Baseline Value', fieldType: 'text', description: "The value of the indicator at the start of the project or reporting period." },
  { id: 'baseline_date', label: '7. Baseline Date', fieldType: 'date', description: "Date the baseline value was established." },
  { id: 'target_value', label: '8. Target Value', fieldType: 'text', required: true, description: "The desired value of the indicator by a specific time." },
  { id: 'target_date', label: '9. Target Date', fieldType: 'date', required: true, description: "Date by which the target should be achieved." },
  { id: 'data_source', label: '10. Data Source(s)', fieldType: 'textarea', required: true, description: "Where and how the data will be obtained (e.g., survey, records, observation)." },
  { id: 'collection_method', label: '11. Method of Data Collection', fieldType: 'textarea', required: true, description: "Specific tools and procedures for collecting data (e.g., questionnaire, focus group discussion guide)." },
  { id: 'collection_frequency', label: '12. Frequency of Data Collection', fieldType: 'text', required: true, placeholder: "e.g., Monthly, Quarterly, Annually" },
  { id: 'responsible_collection', label: '13. Responsible for Data Collection', fieldType: 'text', required: true, description: "Person, role, or department." },
  { id: 'responsible_reporting', label: '14. Responsible for Reporting', fieldType: 'text', required: true, description: "Person, role, or department." },
  { id: 'disaggregation', label: '15. Disaggregation', fieldType: 'textarea', description: "How the data will be broken down (e.g., by gender, age, location)." },
  { id: 'calculation_method', label: '16. Calculation Method (if any)', fieldType: 'textarea', description: "Formula or steps to calculate the indicator value. For direct counts, state 'Direct Count'." },
  { id: 'rationale', label: '17. Rationale/Justification', fieldType: 'textarea', description: "Why this indicator is important and appropriate for measuring the objective." },
  { id: 'notes_comments', label: '18. Notes/Comments', fieldType: 'textarea', description: "Any other relevant information, limitations, or considerations." },
  { id: 'status_thresholds', label: '19. Status Thresholds (for Numeric/Percentage)', fieldType: 'textarea', description: "Define 'Off Track', 'At Risk', 'On Track' thresholds if applicable (e.g., <70% Off Track, <90% At Risk)." },
];

export const MOCK_PIRS_TEMPLATES: PirsTemplate[] = [
  {
    id: 'pirs_numeric_output',
    name: 'Numeric Output Indicator PIRS',
    description: 'A standard template for defining numeric output indicators.',
    category: 'Output Indicators',
    fields: [
      ...commonPirsFields.map(f => {
        if (f.id === 'unit_of_measure') return { ...f, placeholder: "e.g., Number of participants, Number of workshops" };
        if (f.id === 'target_value') return { ...f, fieldType: 'number' as 'number' };
        if (f.id === 'baseline_value') return { ...f, fieldType: 'number' as 'number' };
        return f;
      })
    ]
  },
  {
    id: 'pirs_percentage_outcome',
    name: 'Percentage Outcome Indicator PIRS',
    description: 'A template for percentage-based outcome indicators.',
    category: 'Outcome Indicators',
    fields: [
      ...commonPirsFields.map(f => {
        if (f.id === 'unit_of_measure') return { ...f, placeholder: "e.g., Percentage (%)" };
        if (f.id === 'target_value') return { ...f, fieldType: 'number' as 'number', placeholder: "Enter value (0-100)" };
        if (f.id === 'baseline_value') return { ...f, fieldType: 'number' as 'number', placeholder: "Enter value (0-100)" };
        if (f.id === 'calculation_method') return { ...f, placeholder: "e.g., (Numerator / Denominator) * 100. Define Numerator and Denominator." };
        return f;
      })
    ]
  },
  {
    id: 'pirs_qualitative_process',
    name: 'Qualitative Process Indicator PIRS',
    description: 'A template for qualitative indicators, often used for process monitoring.',
    category: 'Process Indicators',
    fields: [
      ...commonPirsFields.map(f => {
        if (f.id === 'unit_of_measure') return { ...f, placeholder: "e.g., Text, Observation Scale, Yes/No" };
        if (f.id === 'target_value') return { ...f, fieldType: 'textarea' as 'textarea', placeholder: "Describe the desired state or criteria for success." };
        if (f.id === 'baseline_value') return { ...f, fieldType: 'textarea' as 'textarea', placeholder: "Describe the initial state." };
        if (f.id === 'calculation_method') return { ...f, description: "Describe how the qualitative data will be analyzed or summarized to determine status." };
        if (f.id === 'status_thresholds') return { ...f, description: "Describe qualitative criteria for 'Off Track', 'At Risk', 'On Track'." };
        return f;
      })
    ]
  }
];


// --- Existing Icons ---
export const CloseIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => {
  return React.createElement(
    'svg',
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: "1.5",
      stroke: "currentColor",
      className: className,
      "aria-hidden": "true",
    },
    React.createElement('path', {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M6 18L18 6M6 6l12 12",
    })
  );
};

export const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement(
    'svg',
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: "1.5",
      stroke: "currentColor",
      className: className,
      "aria-hidden": "true",
    },
    React.createElement('path', {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M12 4.5v15m7.5-7.5h-15",
    })
  );
};

export const EditIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  return React.createElement(
    'svg',
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: "1.5",
      stroke: "currentColor",
      className: className,
      "aria-hidden": "true",
    },
    React.createElement('path', {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10",
    })
  );
};

export const DeleteIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  return React.createElement(
    'svg',
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: "1.5",
      stroke: "currentColor",
      className: className,
      "aria-hidden": "true",
    },
    React.createElement('path', {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.242.078 3.223.226M5.256 5.79c-.096.265-.18.538-.258.815m0 0c-.01.02-.018.036-.026A48.44 48.44 0 0 1 12 4.5c2.396 0 4.661.27 6.817.763m0 0c-.277-.087-.55-.258-.814m-6.559 0c-.226-.046-.446-.069-.662m0 0c-.023-.046-.069-.069-.112M12 4.5c-.031-.027-.06-.053-.09-.079m0 0c-.089-.169-.213-.313-.326M5.256 5.79c-.096.265-.18.538-.258.815m0 0a48.108 48.108 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0",
    })
  );
};

export const FrameworkIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.5 6h9.75M10.5 6a2.25 2.25 0 1 1-4.5 0 .75.75 0 0 0 1.5-.642 2.25 2.25 0 0 1 3-.638zM10.5 12h9.75m-9.75 0a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0zm-3-1.5h.008v.008H7.5v-.008zm0 4.5h.008v.008H7.5v-.008zm.375-1.875a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm4.125 4.5h9.75m-9.75 0a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0zm-3-1.5h.008v.008H7.5v-.008zm0 4.5h.008v.008H7.5v-.008z" })
  );
};

export const DataIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75z" })
  );
};

export const ReportIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => { // Original Report Icon (Pie Chart)
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5z" })
  );
};

export const AdminIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.142.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.893c-.09.543-.56.94-1.11.94h-1.094c-.55 0-1.019-.397-1.11-.94l-.149-.893c-.07-.425-.383-.765-.78-.93-.398-.165-.854-.142-1.204.107l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.142-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" })
  );
};

export const SettingsIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.223.894c.07.282.16.554.294.802.134.248.305.475.508.67.203.195.434.36.686.493.252.134.517.227.79.293l.875.218c.542.135.94.63.94 1.19v2.594c0 .56-.398 1.055-.94 1.19l-.875.218c-.273.066-.538.16-.79.293-.252.133-.483.298-.686.493-.203.195-.374.422-.508.67-.134.248-.224.52-.294.802l-.223.894c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.223-.894a6.133 6.133 0 0 1-.294-.802 5.994 5.994 0 0 1-.508-.67c-.203-.195-.434-.36-.686-.493a6.05 6.05 0 0 1-.79-.293l-.875-.218c-.542-.135-.94-.63-.94-1.19V8.839c0-.56.398-1.055.94-1.19l.875-.218a6.049 6.049 0 0 1 .79-.293c.252-.133.483-.298.686-.493.203-.195.374-.422.508-.67.134-.248.224-.52.294-.802l.223-.894z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" })
  );
};

export const HomeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" })
  );
};

export const ViewListIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" })
  );
};

export const BriefcaseIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M20.25 14.15v4.073a2.25 2.25 0 0 1-2.243 2.243H5.993A2.25 2.25 0 0 1 3.75 18.223V14.15M20.25 14.15V9.75a2.25 2.25 0 0 0-2.25-2.25H5.993A2.25 2.25 0 0 0 3.75 9.75v4.4M20.25 14.15L16.5 10.5M3.75 14.15L7.5 10.5m9 3.65H7.5m3.75 0V7.5m0 3.75h3.75M12 3.75c-2.454 0-4.67.867-6.375 2.25m12.75 0C16.67.867 14.454 0 12 0c-2.454 0-4.67.867-6.375 2.25" })
  );
};

export const ChartBarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" })
  );
};

export const DocumentReportIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 5.25 6h.008a2.25 2.25 0 0 1 2.242 2.135M8.25 10.5h2.25M15.75 15h3.75M15.75 18h3.75M15.75 12h3.75m-7.5 8.25h1.5a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 .75.75Z" })
  );
};

export const LightBulbIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className, "aria-hidden": "true" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.355a12.073 12.073 0 0 1-4.5 0m7.5 0V12A2.25 2.25 0 0 0 15 9.75H9A2.25 2.25 0 0 0 6.75 12v8.25m7.5-8.25a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" })
  );
};

// --- New Icons for Expanded Features ---

export const BookOpenIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" })
  )
);

export const ArchiveIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" })
  )
);

export const ClipboardListIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" })
  )
);

export const ShareIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M7.217 10.907a2.25 2.25 0 100 4.186 2.25 2.25 0 000-4.186zM12 15.75a2.25 2.25 0 100 4.186 2.25 2.25 0 000-4.186zM16.783 10.907a2.25 2.25 0 100 4.186 2.25 2.25 0 000-4.186zM12 6.75a2.25 2.25 0 100 4.186 2.25 2.25 0 000-4.186zM4.53 13.22a2.25 2.25 0 100 4.186 2.25 2.25 0 000-4.186zM19.47 13.22a2.25 2.25 0 100 4.186 2.25 2.25 0 000-4.186zM12 11.25a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM12 15.75V18m0 0V15.75m0 2.25V18m0-2.25V15.75M12 3.75v2.25m0 0V3.75m0 2.25V6m0-2.25V6M7.5 6.75v2.25M7.5 9V6.75m0 2.25V9m0-2.25V9m9-2.25v2.25m0 0V6.75m0 2.25V9m0-2.25V9M15 13.5V12m0 1.5V12m0 1.5V12M9 13.5V12m0 1.5V12m0 1.5V12M3 13.5V12m0 1.5V12m0 1.5V12m18-1.5V12m0 1.5V12m0 1.5V12" }) //This is a complex network, good for workflow
  )
);

export const ChatAlt2Icon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3M6.75 20.25h10.5A2.25 2.25 0 0019.5 18V7.5A2.25 2.25 0 0017.25 5.25H6.75A2.25 2.25 0 004.5 7.5v10.5A2.25 2.25 0 006.75 20.25z" })
  )
);

export const DevicePhoneMobileIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3m-3-3h3m-3-3h3m-3-3h3" })
  )
);

export const ArrowUpTrayIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" })
  )
);
export const ArrowDownTrayIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" })
  )
);

export const DocumentDuplicateIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375m7.5 0c.621 0 1.125.504 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" })
  )
);

export const TagIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 6h.008v.008H6V6z" })
  )
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" })
  )
);

export const MapIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 6.75V15m6-6v8.25m.503-6.998l4.875-2.187a.75.75 0 00-.227-1.402l-5.25-1.969a.75.75 0 00-.658.116L8.402 5.057a.75.75 0 00-.227 1.402l4.875 2.187a.75.75 0 00.658-.116zM15 12.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM4.503 14.002L9.378 11.815a.75.75 0 00.227-1.402l-5.25-1.969a.75.75 0 00-.658.116L-.402 8.557a.75.75 0 00-.227 1.402l4.875 2.187a.75.75 0 00.658-.116z" }) // Simplified path
  )
);

export const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" })
  )
);

export const CodeBracketIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" })
  )
);

export const GlobeAltIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 003 12c0-.778.099-1.533.284-2.253m0 0A11.978 11.978 0 0012 7.5c2.998 0 5.74 1.1 7.843 2.918" })
  )
);

export const CollectionIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" })
  )
);

export const PencilAltIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" })
  )
);

export const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" })
  )
);

export const TerminalIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" })
  )
);

// Status Icons
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", className },
    React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" })
  )
);

export const ExclamationCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", className },
    React.createElement('path', { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z", clipRule: "evenodd" })
  )
);

export const XCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", className },
    React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" })
  )
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" }) // Same as ArrowDownTrayIcon, good for generic download
  )
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 14.188l-1.25.781 1.25.781L17 18.75l1.25-2.813 1.25-.781-1.25-.781L18.25 12zM16 2.25l-.813 2.846a4.5 4.5 0 00-3.09 3.09L9.25 9l2.846.813a4.5 4.5 0 003.09 3.09L18.001 12l-2.846.813a4.5 4.5 0 00-3.09 3.09L9.25 18.75M22.5 12l-1.25-.781-1.25.781 1.25.781 1.25-.781L22.5 12z" })
  )
);

export const TableCellsIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125V6.375m1.125 13.125A1.125 1.125 0 005.25 19.5h13.5A1.125 1.125 0 0019.5 18.375V6.375m0 13.125A1.125 1.125 0 0118.375 19.5h-1.5m1.5 0V6.375m0 0A1.125 1.125 0 0018.375 5.25h-1.5M16.875 5.25h-1.5A1.125 1.125 0 0014.25 6.375v11.25c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125V6.375zM9.75 5.25H12m0 0A1.125 1.125 0 0113.125 6.375v11.25c0 .621-.504 1.125-1.125 1.125H9.75c-.621 0-1.125-.504-1.125-1.125V6.375A1.125 1.125 0 019.75 5.25zm0 0H5.25m4.5 0V3.375M5.25 3.375A1.125 1.125 0 004.125 4.5v13.5A1.125 1.125 0 005.25 19.5h13.5" })
  )
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.5 12.75l6 6 9-13.5" })
  )
);

export const EyeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
  )
);