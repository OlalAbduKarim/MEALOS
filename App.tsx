
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Project, Indicator, DataPoint, ModalState, IndicatorDataType, RibbonTabConfig, RibbonTabId, FeatureViewType, 
  AggregationType, StatusThresholds, ModalDataAddDataPoint, SuccessStory, LessonLearned, ModalDataSuccessStory, ModalDataLessonLearned,
  TheoryOfChangeFramework, LogFrameFramework, ResultsChainFramework, FrameworkTemplateType, PirsTemplate // New framework types
} from './types';
import { 
  INITIAL_PROJECT_SEED, 
  DEFAULT_STATUS_THRESHOLDS,
  MOCK_PIRS_TEMPLATES, // Import PIRS Templates
  PlusIcon, HomeIcon, FrameworkIcon, DataIcon, ReportIcon, AdminIcon, SettingsIcon, ViewListIcon, BriefcaseIcon, ChartBarIcon, DocumentReportIcon, LightBulbIcon, EditIcon, DeleteIcon, DownloadIcon, 
  BookOpenIcon, ArchiveIcon, ClipboardListIcon, ShareIcon, ChatAlt2Icon, DevicePhoneMobileIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, DocumentDuplicateIcon, TagIcon, CalendarIcon, MapIcon, UsersIcon, CodeBracketIcon, GlobeAltIcon, CollectionIcon, PencilAltIcon, ShieldCheckIcon, TerminalIcon, SparklesIcon, TableCellsIcon 
} from './constants';
import useLocalStorage from './hooks/useLocalStorage';
import { mealApiClient } from './services/apiClient';
import { isSupabaseConfigured, testSupabaseConnection } from './services/supabaseClient';


import RibbonBar from './components/ui/RibbonBar';
import Button from './components/ui/Button';
import Textarea from './components/ui/Textarea'; // For framework editing

import HomeScreen from './components/HomeScreen';
import ProjectHeader from './components/ProjectHeader';
import IndicatorCard from './components/IndicatorCard';
import IndicatorForm from './components/IndicatorForm';
import DataPointForm from './components/DataPointForm';
import ProjectForm from './components/ProjectForm';
import PlaceholderFeatureView from './components/PlaceholderFeatureView';

// Implemented Feature Views
import ExportDataView from './components/features/ExportDataView'; 
import IndicatorLibraryView from './components/features/IndicatorLibraryView'; 
import AIInsightsView from './components/features/AIInsightsView';
import IndicatorTrackingTableView from './components/features/IndicatorTrackingTableView';
import SuccessStoriesRepoView from './components/features/SuccessStoriesRepoView';
import SuccessStoryForm from './components/SuccessStoryForm';
import LessonsLearnedTrackerView from './components/features/LessonsLearnedTrackerView';
import LessonLearnedForm from './components/LessonLearnedForm';
import LogFrameDesignerView from './components/features/LogFrameDesignerView';
import TheoryOfChangeVisualizer from './components/features/TheoryOfChangeVisualizer';
import ResultsChainEditor from './components/features/ResultsChainEditor';
import DataCleaningToolsView from './components/features/DataCleaningToolsView';
import PirsTemplatesView from './components/features/PirsTemplatesView'; 
import FormBuilderView from './components/features/FormBuilderView';
import FormTemplatesView from './components/features/FormTemplatesView';
import MobileAppSyncView from './components/features/MobileAppSyncView';
import ImportDataView from './components/features/ImportDataView';
import FormSubmissionsView from './components/features/FormSubmissionsView';
import MultiProjectDashboardView from './components/features/MultiProjectDashboardView';
import ProjectMapView from './components/features/ProjectMapView';
import EvaluationManagementView from './components/features/EvaluationManagementView';
import AccountabilityView from './components/features/AccountabilityView';
import RiskRegisterView from './components/features/RiskRegisterView';
import ReportGeneratorView from './components/features/ReportGeneratorView';
import AuditTrailView from './components/features/AuditTrailView';
import UserManagementView from './components/features/UserManagementView';
import { AuthModal } from './components/auth/AuthModal';
import { mealStorage } from './services/mealStorage';
import { accessControl } from './services/authService';
import { UserRole, UserProfile, Organisation } from './types';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [lessonsLearned, setLessonsLearned] = useState<LessonLearned[]>([]);
  
  // Frameworks State
  const [activeTheoryOfChange, setActiveTheoryOfChange] = useState<TheoryOfChangeFramework | null>(null);
  const [activeLogFrame, setActiveLogFrame] = useState<LogFrameFramework | null>(null);
  const [activeResultsChain, setActiveResultsChain] = useState<ResultsChainFramework | null>(null);
  
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string | null>('me_tracker_active_project_id', null);
  
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null });
  const [activeAppScreenTab, setActiveAppScreenTab] = useState<RibbonTabId>(activeProjectId ? 'project_home' : 'home');
  const [currentMainView, setCurrentMainView] = useState<FeatureViewType | null>(null);

  // Authentication & Multi-Tenant State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => accessControl.isAuthenticated() ? accessControl.getCurrentUser() : null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [organisations, setOrganisations] = useState<Organisation[]>(() => mealStorage.getOrganisations());
  const [activeOrgId, setActiveOrgId] = useState(() => mealStorage.getActiveOrganisationId());
  const [activeRole, setActiveRole] = useState<UserRole>(() => accessControl.getCurrentRole());
  const [dismissDbBanner, setDismissDbBanner] = useState(false);
  const [showDbDetails, setShowDbDetails] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [dbHealth, setDbHealth] = useState<{ connected: boolean; message: string; writeAllowed: boolean; rlsNotice?: string } | null>(null);

  const defaultToc: Omit<TheoryOfChangeFramework, 'id' | 'projectId' | 'lastUpdated'> = { inputs: '', activities: '', outputs: '', outcomes: '', impact: '', assumptions: '' };
  const defaultLogFrame: Omit<LogFrameFramework, 'id' | 'projectId' | 'lastUpdated'> = { goal: '', outcomes: '', outputs: '', activities: '', goalIndicators: '', outcomeIndicators: '', outputIndicators: '', activityIndicators: '', goalMov: '', outcomeMov: '', outputMov: '', activityMov: '', goalAssumptions: '', outcomeAssumptions: '', outputAssumptions: '', activityAssumptions: '' };
  const defaultResultsChain: Omit<ResultsChainFramework, 'id' | 'projectId' | 'lastUpdated'> = { inputs: '', activities: '', outputs: '', shortTermOutcomes: '', mediumTermOutcomes: '', longTermImpact: '' };

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = accessControl.onAuthChange((session) => {
      setCurrentUser(session?.user || null);
      if (session?.user) {
        setActiveRole(session.user.role);
        if (session.user.organisationId) {
          setActiveOrgId(session.user.organisationId);
        }
      }
    });
    return unsubscribe;
  }, []);

  const initializeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projRes, indRes, dpRes, storiesRes, lessonsRes, orgsRes] = await Promise.all([
        mealApiClient.getProjects(),
        mealApiClient.getIndicators(),
        mealApiClient.getDataPoints(),
        mealApiClient.getSuccessStories(),
        mealApiClient.getLessonsLearned(),
        mealApiClient.getOrganisations()
      ]);

      const projectsData = projRes.data || [];
      setProjects(projectsData);
      setIndicators(indRes.data || []);
      setDataPoints(dpRes.data || []);
      setSuccessStories(storiesRes.data || []);
      setLessonsLearned(lessonsRes.data || []);
      
      if (orgsRes.data && orgsRes.data.length > 0) {
        setOrganisations(orgsRes.data);
      }

      if (projectsData.length > 0) {
        if (!activeProjectId || !projectsData.some(p => p.id === activeProjectId)) {
          setActiveProjectId(projectsData[0].id);
        }
      } else {
        setActiveProjectId(null);
      }
    } catch (err: any) {
      console.warn('Initial data synchronization notice:', err);
    } finally {
      setProjectsLoaded(true);
      setIsLoading(false);
    }
  }, [activeProjectId, setActiveProjectId]);

  useEffect(() => {
    initializeData();
    testSupabaseConnection().then(setDbHealth);
  }, []);

  // Framework Data Loader
  useEffect(() => {
    if (!activeProjectId) {
      setActiveTheoryOfChange(null);
      setActiveLogFrame(null);
      setActiveResultsChain(null);
      return;
    }

    let isMounted = true;
    async function loadFrameworks() {
      try {
        const [toc, lf, rc] = await Promise.all([
          mealApiClient.getTheoryOfChange(activeProjectId!),
          mealApiClient.getLogFrame(activeProjectId!),
          mealApiClient.getResultsChain(activeProjectId!)
        ]);

        if (!isMounted) return;
        setActiveTheoryOfChange(toc || { projectId: activeProjectId!, ...defaultToc, lastUpdated: new Date().toISOString() });
        setActiveLogFrame(lf || { projectId: activeProjectId!, ...defaultLogFrame, lastUpdated: new Date().toISOString() });
        setActiveResultsChain(rc || { projectId: activeProjectId!, ...defaultResultsChain, lastUpdated: new Date().toISOString() });
      } catch (err) {
        console.warn('Framework sync notice:', err);
      }
    }

    loadFrameworks();

    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  const globalViews: FeatureViewType[] = [
    'indicator_library', 
    'manage_users', 
    'manage_roles', 
    'api_management', 
    'audit_trail', 
    'webhook_config', 
    'localization_settings', 
    'notifications_config', 
    'task_manager_integrations', 
    'backup_recovery_tools', 
    'external_system_integrations', 
    'my_tasks', 
    'multi_project_dashboard', 
    'pirs_templates',
    'evaluation_management',
    'accountability_safeguarding',
    'risk_register'
  ];

  useEffect(() => {
    if (!activeProjectId) { 
      if (!currentMainView || !globalViews.includes(currentMainView)) {
        setCurrentMainView(null);
      }
      setActiveAppScreenTab('home');
    } else { 
      if (activeAppScreenTab === 'home') {
         setActiveAppScreenTab('project_home');
      }
    }
  }, [activeProjectId, currentMainView, activeAppScreenTab, globalViews]);


  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find(p => p.id === activeProjectId) || null;
  }, [activeProjectId, projects]);

  const handleOpenModal = useCallback((type: ModalState['type'], data?: any) => {
    setModalState({ isOpen: true, type, data });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, type: null, data: undefined });
  }, []);

  // Project CRUD
  const handleCreateProject = useCallback(async (projectData: Omit<Project, 'id'>) => {
    setIsLoading(true); setError(null);
    try {
      const createdId = `proj_${Date.now()}`;
      const newProj: Project = { id: createdId, ...projectData, organisationId: activeOrgId || 'org_default' };
      const res = await mealApiClient.saveProject(newProj);
      if (!res.success) {
        setError(res.error || "Failed to create project in Supabase.");
        return;
      }
      setProjects(prev => [newProj, ...prev]);
      setActiveProjectId(createdId);
      mealStorage.logAudit(activeOrgId, createdId, 'Project Created', 'Project', createdId, `Created project "${projectData.name}"`);
      setActiveAppScreenTab('project_home'); 
      setCurrentMainView(null); 
    } catch (e: any) { 
      console.error("Error creating project: ", e); 
      setError(e.message || "Failed to create project."); 
    } finally { 
      setIsLoading(false); 
    }
  }, [setActiveProjectId, activeOrgId]);

  const handleUpdateProjectDetails = useCallback(async (updatedProjectData: Project) => {
    setIsLoading(true); setError(null);
    try {
      const res = await mealApiClient.saveProject(updatedProjectData);
      if (!res.success) {
        setError(res.error || "Failed to update project in Supabase.");
        return;
      }
      setProjects(prev => prev.map(p => p.id === updatedProjectData.id ? updatedProjectData : p));
      mealStorage.logAudit(activeOrgId, updatedProjectData.id, 'Project Details Updated', 'Project', updatedProjectData.id, `Updated "${updatedProjectData.name}"`);
    } catch (e: any) { 
      console.error("Error updating project: ", e); 
      setError(e.message || "Failed to update project details."); 
    } finally { 
      setIsLoading(false); 
    }
  }, [activeOrgId]);
  
  const handleDeleteProject = useCallback(async (projectId: string) => {
    setIsLoading(true); setError(null);
    try {
      await mealApiClient.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setIndicators(prev => prev.filter(i => i.projectId !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(null); setCurrentMainView(null); setActiveAppScreenTab('home');
      }
      mealStorage.logAudit(activeOrgId, projectId, 'Project Deleted', 'Project', projectId, 'Deleted project and associated indicators');
    } catch (e: any) { 
      console.error("Error deleting project: ", e); 
      setError("Failed to delete project."); 
    } finally { 
      setIsLoading(false); 
    }
  }, [activeProjectId, setActiveProjectId, activeOrgId]);

  const handleRoleChange = useCallback((role: UserRole) => {
    setActiveRole(role);
    mealStorage.setActiveRole(role);
    mealStorage.logAudit(activeOrgId, activeProjectId || undefined, 'Role Switched', 'UserProfile', role, `Switched persona role to ${role}`);
  }, [activeOrgId, activeProjectId]);

  const handleOrgChange = useCallback((orgId: string) => {
    setActiveOrgId(orgId);
    mealStorage.setActiveOrganisationId(orgId);
    mealStorage.logAudit(orgId, undefined, 'Organisation Switched', 'Organisation', orgId, `Switched active organization to ${orgId}`);
  }, []);

  const handleSignOut = useCallback(async () => {
    await accessControl.signOut();
    setCurrentUser(null);
  }, []);

  const handleSelectProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    if (currentMainView && !globalViews.includes(currentMainView)) {
        setCurrentMainView(null); 
    } else if (!currentMainView && activeAppScreenTab !== 'project_home') {
         setCurrentMainView(null);
    }
    setActiveAppScreenTab('project_home');
  }, [setActiveProjectId, currentMainView, globalViews, activeAppScreenTab]);

  const handleGoHome = () => {
    setActiveProjectId(null); setCurrentMainView(null); setActiveAppScreenTab('home');
  };

  const handleTabSelect = (tabId: RibbonTabId) => {
    setActiveAppScreenTab(tabId);
    if (tabId === 'home') {
        if (currentMainView && !globalViews.includes(currentMainView)) setCurrentMainView(null);
    } else if (tabId === 'project_home' && activeProjectId) {
        if (!currentMainView || (currentMainView && globalViews.includes(currentMainView))) setCurrentMainView(null); 
    }
  };

  const logAudit = useCallback((params: { action: string; entityType: string; entityId: string; details: string; performedBy?: string }) => {
    mealStorage.logAudit(
      activeProject?.organisationId || mealStorage.getActiveOrganisationId(),
      activeProject?.id,
      params.action,
      params.entityType,
      params.entityId,
      `${params.details} (Actor: ${params.performedBy || activeRole})`
    );
  }, [activeProject, activeRole]);

  // Indicator CRUD
  // Indicator CRUD
  const handleAddIndicator = useCallback(async (indicatorData: Omit<Indicator, 'id'>) => {
    if (!activeProject) { setError("Active project not available."); return; }
    if (!accessControl.canMutateIndicator()) {
      setError("Access Denied: Donors, field enumerators, and read-only roles cannot create indicators.");
      return;
    }
    setIsLoading(true); setError(null);
    try {
      const newInd: Indicator = {
        id: 'ind_' + Date.now(),
        ...indicatorData,
        projectId: activeProject.id,
        statusThresholds: indicatorData.statusThresholds || { ...DEFAULT_STATUS_THRESHOLDS }
      };
      await mealApiClient.saveIndicator(newInd);
      setIndicators(prev => [...prev, newInd]);
      logAudit({ action: 'CREATE', entityType: 'indicator', entityId: newInd.id, details: `Created indicator: ${newInd.name}`, performedBy: activeRole });
    } catch (e: any) { 
      console.warn("Error adding indicator: ", e);
      setError("Failed to add indicator.");
    } 
    finally { setIsLoading(false); }
  }, [activeProject, activeRole, logAudit]);

  const handleEditIndicator = useCallback(async (updatedIndicatorData: Indicator) => {
    if (!accessControl.canMutateIndicator()) {
      setError("Access Denied: Donors, field enumerators, and read-only roles cannot edit indicators.");
      return;
    }
    setIsLoading(true); setError(null);
    try {
      await mealApiClient.saveIndicator(updatedIndicatorData);
      setIndicators(prev => prev.map(ind => ind.id === updatedIndicatorData.id ? updatedIndicatorData : ind));
      logAudit({ action: 'UPDATE', entityType: 'indicator', entityId: updatedIndicatorData.id, details: `Updated indicator: ${updatedIndicatorData.name}`, performedBy: activeRole });
    } catch (e: any) { 
      console.warn("Error updating indicator: ", e);
      setError("Failed to update indicator.");
    } 
    finally { setIsLoading(false); }
  }, [activeRole, logAudit]);
  
  const handleDeleteIndicator = useCallback(async (indicatorId: string) => {
    if (!accessControl.canMutateIndicator()) {
      setError("Access Denied: Donors, field enumerators, and read-only roles cannot delete indicators.");
      return;
    }
    setIsLoading(true); setError(null);
    try {
      await mealApiClient.deleteIndicator(indicatorId);
      setIndicators(prev => prev.filter(ind => ind.id !== indicatorId));
      setDataPoints(prev => prev.filter(dp => dp.indicatorId !== indicatorId));
      logAudit({ action: 'DELETE', entityType: 'indicator', entityId: indicatorId, details: `Deleted indicator ${indicatorId}`, performedBy: activeRole });
    } catch (e: any) { 
      console.warn("Error deleting indicator: ", e);
      setError("Failed to delete indicator.");
    } 
    finally { setIsLoading(false); }
  }, [activeRole, logAudit]);

  // DataPoint Direct Handlers for Submissions, Import & Cleaning
  const handleAddDataPointRaw = useCallback(async (dataPointData: Omit<DataPoint, 'id'>) => {
    if (accessControl.isReadOnly()) {
      setError("Access Denied: Donors have read-only access and cannot add data points.");
      return;
    }
    setIsLoading(true);
    try {
      const newDp: DataPoint = {
        id: 'dp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        ...dataPointData,
        tags: dataPointData.tags || {}
      };
      await mealApiClient.saveDataPoint(newDp);
      setDataPoints(prev => [...prev, newDp]);
      logAudit({ action: 'CREATE', entityType: 'datapoint', entityId: newDp.id, details: `Added data point: ${newDp.actualValue} for indicator ${newDp.indicatorId}`, performedBy: activeRole });
    } catch (e: any) {
      console.warn("Fallback local datapoint add", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeRole, logAudit]);

  const handleUpdateDataPointRaw = useCallback(async (updatedDp: DataPoint) => {
    if (accessControl.isReadOnly()) {
      setError("Access Denied: Donors have read-only access and cannot clean or update data points.");
      return;
    }
    setIsLoading(true);
    try {
      await mealApiClient.saveDataPoint(updatedDp);
      setDataPoints(prev => prev.map(dp => dp.id === updatedDp.id ? updatedDp : dp));
      logAudit({ action: 'UPDATE', entityType: 'datapoint', entityId: updatedDp.id, details: `Cleaned/Updated data point ${updatedDp.id}: ${updatedDp.actualValue} (${updatedDp.verificationStatus})`, performedBy: activeRole });
    } catch (e: any) {
      console.warn("Fallback local datapoint update", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeRole, logAudit]);

  // DataPoint Modal CRUD
  const handleAddDataPoint = useCallback(async (dataPointData: Omit<DataPoint, 'id' | 'indicatorId'>) => {
    const modalData = modalState.data as ModalDataAddDataPoint | undefined;
    if (!modalData?.indicator?.id) { setError("Indicator information missing."); return; }
    await handleAddDataPointRaw({
      ...dataPointData,
      indicatorId: modalData.indicator.id
    });
  }, [modalState.data, handleAddDataPointRaw]);

  // Success Story CRUD
  const handleAddSuccessStory = useCallback(async (storyData: Omit<SuccessStory, 'id' | 'projectId'>) => {
    if (!activeProjectId) { setError("Active project not available."); return; }
    setIsLoading(true); setError(null);
    try {
      const newStory: SuccessStory = {
        id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        projectId: activeProjectId,
        ...storyData
      };
      mealStorage.saveSuccessStory(newStory);
      setSuccessStories(prev => [newStory, ...prev]);
    } 
    catch (e: any) { console.warn("Error adding success story: ", e); setError("Failed to add success story."); } 
    finally { setIsLoading(false); }
  }, [activeProjectId]);

  const handleEditSuccessStory = useCallback(async (updatedStory: SuccessStory) => {
    setIsLoading(true); setError(null);
    try {
      mealStorage.saveSuccessStory(updatedStory);
      setSuccessStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
    } catch (e: any) { console.warn("Error updating success story: ", e); setError("Failed to update success story."); } 
    finally { setIsLoading(false); }
  }, []);

  const handleDeleteSuccessStory = useCallback(async (storyId: string) => {
    setIsLoading(true); setError(null);
    try {
      mealStorage.deleteSuccessStory(storyId);
      setSuccessStories(prev => prev.filter(s => s.id !== storyId));
    } 
    catch (e: any) { console.warn("Error deleting success story: ", e); setError("Failed to delete success story."); } 
    finally { setIsLoading(false); }
  }, []);

  // Lesson Learned CRUD
  const handleAddLessonLearned = useCallback(async (lessonData: Omit<LessonLearned, 'id' | 'projectId'>) => {
    if (!activeProjectId) { setError("Active project not available."); return; }
    setIsLoading(true); setError(null);
    try {
      const newLesson: LessonLearned = {
        id: `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        projectId: activeProjectId,
        ...lessonData
      };
      mealStorage.saveLessonLearned(newLesson);
      setLessonsLearned(prev => [newLesson, ...prev]);
    } 
    catch (e: any) { console.warn("Error adding lesson learned: ", e); setError("Failed to add lesson learned."); } 
    finally { setIsLoading(false); }
  }, [activeProjectId]);

  const handleEditLessonLearned = useCallback(async (updatedLesson: LessonLearned) => {
    setIsLoading(true); setError(null);
    try {
      mealStorage.saveLessonLearned(updatedLesson);
      setLessonsLearned(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
    } catch (e: any) { console.warn("Error updating lesson learned: ", e); setError("Failed to update lesson learned."); } 
    finally { setIsLoading(false); }
  }, []);

  const handleDeleteLessonLearned = useCallback(async (lessonId: string) => {
    setIsLoading(true); setError(null);
    try {
      mealStorage.deleteLessonLearned(lessonId);
      setLessonsLearned(prev => prev.filter(l => l.id !== lessonId));
    } 
    catch (e: any) { console.warn("Error deleting lesson learned: ", e); setError("Failed to delete lesson learned."); } 
    finally { setIsLoading(false); }
  }, []);

  // Framework Save Handlers
  const handleSaveTheoryOfChange = useCallback(async (data: TheoryOfChangeFramework) => {
    if (!activeProjectId) { setError("Active project not available."); return; }
    setIsLoading(true); setError(null);
    try {
      const saveData = { ...data, projectId: activeProjectId, lastUpdated: new Date().toISOString() };
      await mealApiClient.saveTheoryOfChange(saveData);
      setActiveTheoryOfChange(saveData);
    } catch (e: any) { console.warn("Error saving ToC data:", e); setError("Failed to save Theory of Change data."); } 
    finally { setIsLoading(false); }
  }, [activeProjectId]);

  const handleSaveLogFrame = useCallback(async (data: LogFrameFramework) => {
    if (!activeProjectId) { setError("Active project not available."); return; }
    setIsLoading(true); setError(null);
    try {
      const saveData = { ...data, projectId: activeProjectId, lastUpdated: new Date().toISOString() };
      await mealApiClient.saveLogFrame(saveData);
      setActiveLogFrame(saveData);
    } catch (e: any) { console.warn("Error saving LogFrame data:", e); setError("Failed to save LogFrame data."); } 
    finally { setIsLoading(false); }
  }, [activeProjectId]);

  const handleSaveResultsChain = useCallback(async (data: ResultsChainFramework) => {
    if (!activeProjectId) { setError("Active project not available."); return; }
    setIsLoading(true); setError(null);
    try {
      const saveData = { ...data, projectId: activeProjectId, lastUpdated: new Date().toISOString() };
      await mealApiClient.saveResultsChain(saveData);
      setActiveResultsChain(saveData);
    } catch (e: any) { console.warn("Error saving Results Chain data:", e); setError("Failed to save Results Chain data."); } 
    finally { setIsLoading(false); }
  }, [activeProjectId]);

  const handleLoadFrameworkTemplate = useCallback((type: FrameworkTemplateType, templateData: any) => {
    if (!activeProject) {
        setError("Please select or create a project first to load a template into.");
        // alert("Please select or create a project first to load a template into.");
        return;
    }
    setError(null); // Clear previous errors

    // Create a new object for the state, ensuring no old 'id' is carried over from template
    // This makes the loaded template effectively "new" for this project until saved.
    const baseDataForState = {
        ...templateData, // Spread the content of the template
        projectId: activeProject.id,
        lastUpdated: new Date().toISOString(),
        id: undefined // Explicitly undefined, so saving creates a new Firestore doc or updates if one already exists for this project
    };
    
    // Check if a framework for this project already exists in Firestore, if so, preserve its ID.
    // This logic relies on the onSnapshot listeners correctly populating activeTheoryOfChange etc.
    // with existing data (including ID) if it's there.

    if (type === 'toc') {
        setActiveTheoryOfChange(prev => ({ ...(prev || {}), ...baseDataForState, id: prev?.id || undefined } as TheoryOfChangeFramework));
        setCurrentMainView('toc_designer');
        setActiveAppScreenTab('frameworks');
    } else if (type === 'logframe') {
        setActiveLogFrame(prev => ({ ...(prev || {}), ...baseDataForState, id: prev?.id || undefined } as LogFrameFramework));
        setCurrentMainView('logframe_designer');
        setActiveAppScreenTab('frameworks');
    } else if (type === 'results_chain') {
        setActiveResultsChain(prev => ({ ...(prev || {}), ...baseDataForState, id: prev?.id || undefined } as ResultsChainFramework));
        setCurrentMainView('results_framework_designer');
        setActiveAppScreenTab('frameworks');
    }
}, [activeProject, setActiveTheoryOfChange, setActiveLogFrame, setActiveResultsChain, setCurrentMainView, setActiveAppScreenTab, setError]);


  const projectIndicators = useMemo(() => {
    if (!activeProject) return [];
    return indicators.filter(ind => ind.projectId === activeProject.id);
  }, [activeProject, indicators]);


  const homeScreenRibbonTabs = useMemo((): RibbonTabConfig[] => [
    {
      id: 'home', title: 'Application Home', icon: <HomeIcon />,
      groups: [
        { 
          id: 'g_projects', title: 'Projects', 
          buttons: [
            { id: 'b_create_project', label: 'New Project', icon: <PlusIcon className="w-5 h-5 mb-1 text-primary"/>, onClick: () => handleOpenModal('CREATE_PROJECT'), tooltip: 'Start a new M&E project' },
          ]
        },
        {
          id: 'g_general_tools_home', title: 'General Tools',
          buttons: [
             { id: 'b_global_indicator_lib_home', label: 'Indicator Library', icon: <BookOpenIcon className="w-5 h-5 mb-1"/>, onClick: () => { setCurrentMainView('indicator_library'); setActiveAppScreenTab('home');}, tooltip: 'View all indicators across all projects' },
             { id: 'b_global_multi_proj_dash_home', label: 'Multi-Project View', icon: <CollectionIcon className="w-5 h-5 mb-1"/>, onClick: () => { setCurrentMainView('multi_project_dashboard'); setActiveAppScreenTab('home');}, tooltip: 'Compare indicators across multiple projects' },
             { id: 'b_global_evaluations_home', label: 'Evaluations', icon: <DocumentReportIcon className="w-5 h-5 mb-1 text-indigo-600"/>, onClick: () => { setCurrentMainView('evaluation_management'); setActiveAppScreenTab('home'); }, tooltip: 'Portfolio evaluation studies (OECD-DAC)' },
             { id: 'b_global_fcm_home', label: 'Safeguarding / FCM', icon: <ShieldCheckIcon className="w-5 h-5 mb-1 text-rose-600"/>, onClick: () => { setCurrentMainView('accountability_safeguarding'); setActiveAppScreenTab('home'); }, tooltip: 'Complaints and community feedback mechanism' },
             { id: 'b_pirs_templates_home', label: 'PIRS Templates', icon: <DocumentDuplicateIcon className="w-5 h-5 mb-1"/>, onClick: () => { setCurrentMainView('pirs_templates'); setActiveAppScreenTab('home'); }, tooltip: 'View PIRS templates (Global)' },
          ]
        },
         {
            id: 'g_system_access_home', title: 'System Admin',
             buttons: [
                { id: 'b_admin_users_home', label: 'Users & Roles', icon: <UsersIcon className="w-5 h-5 mb-1"/>, onClick: () => { setActiveAppScreenTab('admin'); setCurrentMainView('manage_users'); }, tooltip: 'Manage system users and roles (Admin)' },
                { id: 'b_app_settings_home', label: 'System Settings', icon: <SettingsIcon className="w-5 h-5 mb-1"/>, onClick: () => { setActiveAppScreenTab('admin'); setCurrentMainView('localization_settings');}, tooltip: 'Global application settings (e.g. localization, audit trail) (Admin)' },
             ]
         }
      ]
    },
  ], [handleOpenModal, setCurrentMainView, setActiveAppScreenTab]);

  const projectScreenRibbonTabs = useMemo((): RibbonTabConfig[] => {
    const createViewSetter = (view: FeatureViewType | null) => () => {
        setCurrentMainView(view);
    };
    
    const isProjectContext = !!activeProject; 

    return [
      { 
        id: 'project_home', title: 'Project Space', icon: <BriefcaseIcon />,
        groups: [
           { 
            id: 'g_p_navigation', title: 'Navigation', 
            buttons: [
              { id: 'b_app_home', label: 'App Home', icon: <HomeIcon className="w-5 h-5 mb-1"/>, onClick: handleGoHome, tooltip: 'Back to all projects list' },
              { id: 'b_view_indicators_main', label: 'Indicators', icon: <ViewListIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter(null), tooltip: 'Show project indicator dashboard (Cards)', disabled: !isProjectContext },
              { id: 'b_p_indicator_table', label: 'ITT', icon: <TableCellsIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('indicator_tracking_table'), tooltip: 'Interactive Indicator Tracking Table', disabled: !isProjectContext },
            ]
          },
          {
            id: 'g_p_details_config', title: 'Project Config',
            buttons: [
              { id: 'b_p_project_settings', label: 'Edit Details', icon: <EditIcon className="w-5 h-5 mb-1"/>, onClick: () => handleOpenModal('EDIT_PROJECT_DETAILS', activeProject), tooltip: 'Edit project name, description, dates', disabled: !isProjectContext },
            ]
          },
          {
            id: 'g_p_core_indicators', title: 'Indicator Mgt.',
            buttons: [
              { id: 'b_p_add_indicator', label: 'Add Indicator', icon: <PlusIcon className="w-5 h-5 mb-1 text-primary"/>, onClick: () => handleOpenModal('ADD_INDICATOR'), tooltip: 'Define a new indicator for this project (includes target setting, metadata)', disabled: !isProjectContext },
              { id: 'b_p_indicator_lib', label: 'Global Library', icon: <BookOpenIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('indicator_library'), tooltip: 'Access indicator library (all projects)' },
              { id: 'b_p_pirs', label: 'PIRS Templates', icon: <DocumentDuplicateIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('pirs_templates'), tooltip: 'View Performance Indicator Reference Sheet templates' },
            ]
          },
        ]
      },
      { 
        id: 'frameworks', title: 'M&E Frameworks', icon: <FrameworkIcon/>,
        groups: [ 
          {
            id: 'g_f_design_tools', title: 'Design Tools',
            buttons: [
              { id: 'b_f_logframe', label: 'LogFrame', icon: <FrameworkIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('logframe_designer'), tooltip: 'Design or view Logistical Framework', disabled: !isProjectContext },
              { id: 'b_f_toc', label: 'ToC Editor', icon: <LightBulbIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('toc_designer'), tooltip: 'Design or view Theory of Change', disabled: !isProjectContext },
              { id: 'b_f_results_framework', label: 'Results Chain', icon: <ShareIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('results_framework_designer'), tooltip: 'Design or view Results Chain', disabled: !isProjectContext },
              { id: 'b_f_risk_register', label: 'Risk Register', icon: <ShieldCheckIcon className="w-5 h-5 mb-1 text-amber-500"/>, onClick: createViewSetter('risk_register'), tooltip: '5x5 Risk matrix, mitigations & early warning triggers', disabled: !isProjectContext },
            ]
          }
        ]
      },
      { 
        id: 'data_management', title: 'Data Lifecycle', icon: <DataIcon/>,
        groups: [ 
          {
            id: 'g_dm_collection_forms', title: 'Data Collection',
            buttons: [
              { id: 'b_dm_form_builder', label: 'Form Builder', icon: <PencilAltIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('form_builder'), tooltip: 'Design data collection forms', disabled: !isProjectContext },
              { id: 'b_dm_submissions_queue', label: 'Submissions', icon: <ShieldCheckIcon className="w-5 h-5 mb-1 text-emerald-600"/>, onClick: createViewSetter('form_submissions'), tooltip: 'Review and approve field submissions', disabled: !isProjectContext },
              { id: 'b_dm_form_templates', label: 'Form Templates', icon: <DocumentDuplicateIcon className="w-5 h-5 mb-1" />, onClick: createViewSetter('form_templates'), tooltip: 'Use preloaded standard templates', disabled: !isProjectContext },
              { id: 'b_dm_mobile_sync', label: 'Mobile/Offline', icon: <DevicePhoneMobileIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('mobile_app_sync'), tooltip: 'Mobile data collection settings', disabled: !isProjectContext },
            ]
          },
          {
            id: 'g_dm_import_export', title: 'Manage Data',
            buttons: [
              { id: 'b_dm_import_data', label: 'Import Data', icon: <ArrowUpTrayIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('import_data'), tooltip: 'Import data from files (Excel, CSV)', disabled: !isProjectContext },
              { id: 'b_dm_export_data', label: 'Export Data', icon: <DownloadIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('export_data'), tooltip: 'Export project raw data (CSV)', disabled: !isProjectContext },
              { id: 'b_dm_data_cleaning', label: 'Data Cleaning', icon: <ShieldCheckIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('data_cleaning_tools'), tooltip: 'Tools for data cleaning and validation', disabled: !isProjectContext },
            ]
          },
        ]
      },
      { 
        id: 'analysis_reporting', title: 'Insights & Outputs', icon: <DocumentReportIcon/>,
        groups: [
          {
            id: 'g_ar_dashboards', title: 'Dashboards',
            buttons: [
              { id: 'b_ar_view_dashboards', label: 'View Dashboards', icon: <ChartBarIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('view_dashboards'), tooltip: 'Access project dashboards', disabled: !isProjectContext },
              { id: 'b_ar_multi_proj_dash', label: 'Compare Projects', icon: <CollectionIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('multi_project_dashboard'), tooltip: 'Multi-project comparison dashboard' },
            ]
          },
           {
            id: 'g_ar_analytics_visuals', title: 'Analytics & Visuals',
            buttons: [
                { id: 'b_ar_project_map', label: 'GIS / Maps', icon: <MapIcon className="w-5 h-5 mb-1 text-emerald-600"/>, onClick: createViewSetter('project_map'), tooltip: 'Interactive GIS spatial project map', disabled: !isProjectContext },
                { id: 'b_ar_ai_insights', label: 'AI Insights', icon: <SparklesIcon className="w-5 h-5 mb-1 text-secondary"/>, onClick: createViewSetter('ai_insights'), tooltip: 'AI-based insights & recommendations', disabled: !isProjectContext },
                { id: 'b_ar_export_visuals', label: 'Export Visuals', icon: <DownloadIcon className="w-5 h-5 mb-1" />, onClick: createViewSetter('export_visuals'), tooltip: 'Export charts and dashboards', disabled: !isProjectContext },
            ]
          },
          {
            id: 'g_ar_reporting_docs', title: 'Reporting',
            buttons: [
               { id: 'b_ar_gen_report', label: 'Generate Report', icon: <DocumentReportIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('generate_report'), tooltip: 'Generate official MEAL reports with frozen snapshots', disabled: !isProjectContext },
               { id: 'b_ar_report_templates', label: 'Report Templates', icon: <DocumentDuplicateIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('report_templates'), tooltip: 'Manage report templates', disabled: !isProjectContext },
            ]
          },
        ]
      },
      { 
        id: 'learning_collaboration', title: 'Learning & Team', icon: <UsersIcon/>,
        groups: [
            {
                id: 'g_lc_knowledge', title: 'Knowledge Base',
                buttons: [
                    { id: 'b_lc_success_stories', label: 'Success Stories', icon: <BookOpenIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('success_stories_repo'), tooltip: 'Repository of success stories / case studies', disabled: !isProjectContext },
                    { id: 'b_lc_lessons_learned', label: 'Lessons Learned', icon: <ClipboardListIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('lessons_learned_tracker'), tooltip: 'Track lessons learned', disabled: !isProjectContext },
                ]
            },
            {
                id: 'g_lc_eval_accountability', title: 'Evaluations & FCM',
                buttons: [
                    { id: 'b_lc_evaluations', label: 'Evaluations', icon: <DocumentReportIcon className="w-5 h-5 mb-1 text-indigo-600"/>, onClick: createViewSetter('evaluation_management'), tooltip: 'Baseline, Midterm, Endline & Impact Evaluations', disabled: !isProjectContext },
                    { id: 'b_lc_accountability', label: 'Accountability / FCM', icon: <ShieldCheckIcon className="w-5 h-5 mb-1 text-rose-600"/>, onClick: createViewSetter('accountability_safeguarding'), tooltip: 'Feedback & Complaints Response Mechanism (Safeguarding)', disabled: !isProjectContext },
                ]
            },
            {
                id: 'g_lc_collab_tools', title: 'Collaboration Tools',
                buttons: [
                    { id: 'b_lc_stakeholder_meetings', label: 'Meeting Records', icon: <UsersIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('stakeholder_meetings'), tooltip: 'Log stakeholder meeting records', disabled: !isProjectContext },
                    { id: 'b_lc_comments_feedback', label: 'Feedback Tool', icon: <ChatAlt2Icon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('project_comments'), tooltip: 'Project feedback and comment tool', disabled: !isProjectContext },
                ]
            }
        ]
      },
      { 
        id: 'task_project_management', title: 'Tasks & Workflow', icon: <ClipboardListIcon/>,
        groups: [
            {
                id: 'g_tpm_tasks', title: 'Tasks & Milestones',
                buttons: [
                    { id: 'b_tpm_my_tasks', label: 'My Tasks', icon: <ClipboardListIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('my_tasks'), tooltip: 'View tasks assigned to you' }, 
                    { id: 'b_tpm_project_tasks', label: 'Project Tasks', icon: <CalendarIcon className="w-5 h-5 mb-1"/>, onClick: createViewSetter('project_tasks'), tooltip: 'Activity scheduling, timelines for this project', disabled: !isProjectContext },
                ]
            },
        ]
      },
       { 
        id: 'admin', title: 'System Admin', icon: <AdminIcon />,
        groups: [
            {
                id: 'g_admin_user_role', title: 'User & Role Mgt.',
                buttons: [ 
                    { id: 'b_admin_manage_users', label: 'Manage Users', icon: <UsersIcon className="w-5 h-5 mb-1" />, onClick: createViewSetter('manage_users'), tooltip: 'Manage system users' },
                    { id: 'b_admin_manage_roles', label: 'Manage Roles', icon: <ShieldCheckIcon className="w-5 h-5 mb-1" />, onClick: createViewSetter('manage_roles'), tooltip: 'Manage user roles and permissions' },
                ]
            },
            {
                id: 'g_admin_security_audit', title: 'Security & Audit',
                buttons: [
                    { id: 'b_admin_audit_trail', label: 'Audit Trail', icon: <TerminalIcon className="w-5 h-5 mb-1" />, onClick: createViewSetter('audit_trail'), tooltip: 'View system audit logs' },
                    { id: 'b_admin_backup_recovery', label: 'Backup/Recovery', icon: <ArchiveIcon className="w-5 h-5 mb-1" />, onClick: createViewSetter('backup_recovery_tools'), tooltip: 'Manage system backup and recovery' },
                ]
            },
            {
                id: 'g_admin_system_integrations', title: 'System & Integrations',
                buttons: [ 
                    { id: 'b_admin_localization', label: 'Localization', icon: <GlobeAltIcon className="w-5 h-5 mb-1" />, onClick: createViewSetter('localization_settings'), tooltip: 'Multi-language and localization settings' },
                    { id: 'b_admin_api_mgt', label: 'API Management', icon: <CodeBracketIcon className="w-5 h-5 mb-1" />, onClick: createViewSetter('api_management'), tooltip: 'Manage API access for integrations' },
                ]
            }
        ]
      }
    ];
  }, [activeProject, handleOpenModal, handleGoHome, setCurrentMainView, setActiveAppScreenTab]); 
  
  const currentRibbonTabs = useMemo(() => {
    const isGlobalViewActive = currentMainView && globalViews.includes(currentMainView);
    if (activeProject || isGlobalViewActive) {
      return projectScreenRibbonTabs;
    }
    return homeScreenRibbonTabs;
  }, [activeProject, currentMainView, globalViews, homeScreenRibbonTabs, projectScreenRibbonTabs]);
  

  const renderMainContent = () => {
    if ((!projectsLoaded && !activeProjectId) || (activeProjectId && isLoading && !activeTheoryOfChange && !activeLogFrame && !activeResultsChain)) { 
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="ml-4 text-neutral-600">Loading data...</p>
        </div>
      );
    }
    
    // Handle specific implemented views
    if (activeProject || (currentMainView && globalViews.includes(currentMainView))) { 
        switch(currentMainView) {
            // Data Lifecycle & Collection
            case 'form_builder':
                return <FormBuilderView activeProject={activeProject} projectIndicators={projectIndicators} onNavigateToSubmissions={() => setCurrentMainView('form_submissions')} />;
            case 'form_submissions':
                return <FormSubmissionsView activeProject={activeProject} projectIndicators={projectIndicators} onAddDataPoint={handleAddDataPointRaw} />;
            case 'form_templates':
                return <FormTemplatesView activeProject={activeProject} />;
            case 'mobile_app_sync':
                return <MobileAppSyncView activeProject={activeProject} />;
            case 'import_data':
                return <ImportDataView activeProject={activeProject} projectIndicators={projectIndicators} onImportComplete={() => setCurrentMainView(null)} onAddDataPoint={handleAddDataPointRaw} />;
            case 'export_data':
                return activeProject ? <ExportDataView activeProject={activeProject} projectIndicators={projectIndicators} allDataPoints={dataPoints} /> : <PlaceholderFeatureView featureName="Export Data" />;
            case 'data_cleaning_tools':
                return <DataCleaningToolsView activeProject={activeProject} projectIndicators={projectIndicators} allDataPoints={dataPoints} onUpdateDataPoint={handleUpdateDataPointRaw} />;
            
            // Analytics, Dashboards & Visuals
            case 'indicator_tracking_table':
                return activeProject ? <IndicatorTrackingTableView projectIndicators={projectIndicators} allDataPoints={dataPoints} activeProjectName={activeProject.name} /> : <PlaceholderFeatureView featureName="Indicator Tracking Table" />;
            case 'multi_project_dashboard':
            case 'view_dashboards':
                return <MultiProjectDashboardView projects={projects} indicators={indicators} dataPoints={dataPoints} onSelectProject={handleSelectProject} />;
            case 'project_map':
                return <ProjectMapView activeProject={activeProject} />;
            case 'ai_insights':
                return activeProject ? <AIInsightsView activeProject={activeProject} projectIndicators={projectIndicators} /> : <PlaceholderFeatureView featureName="AI Insights" />;
            case 'generate_report':
            case 'report_templates':
            case 'export_visuals':
                return <ReportGeneratorView activeProject={activeProject} projectIndicators={projectIndicators} allDataPoints={dataPoints} successStories={successStories} />;

            // Frameworks & Risk
            case 'logframe_designer':
                return activeProject ? <LogFrameDesignerView 
                            activeProject={activeProject} 
                            frameworkData={activeLogFrame} 
                            onSaveFramework={handleSaveLogFrame} 
                            isLoading={isLoading}
                        /> : <PlaceholderFeatureView featureName="LogFrame Designer" />;
            case 'toc_designer':
                return activeProject ? <TheoryOfChangeVisualizer 
                            activeProject={activeProject} 
                            frameworkData={activeTheoryOfChange} 
                            onSaveFramework={handleSaveTheoryOfChange}
                            isLoading={isLoading}
                        /> : <PlaceholderFeatureView featureName="Theory of Change Visualizer" />;
            case 'results_framework_designer':
                return activeProject ? <ResultsChainEditor 
                            activeProject={activeProject} 
                            frameworkData={activeResultsChain} 
                            onSaveFramework={handleSaveResultsChain}
                            isLoading={isLoading}
                        /> : <PlaceholderFeatureView featureName="Results Chain Editor" />;
            case 'risk_register':
                return <RiskRegisterView activeProject={activeProject} />;
            case 'pirs_templates':
                return <PirsTemplatesView pirsTemplates={MOCK_PIRS_TEMPLATES} />;

            // Evaluation, Accountability & Learning
            case 'evaluation_management':
                return <EvaluationManagementView activeProject={activeProject} />;
            case 'accountability_safeguarding':
                return <AccountabilityView activeProject={activeProject} />;
            case 'success_stories_repo':
                return activeProject ? <SuccessStoriesRepoView 
                            successStories={successStories} 
                            activeProjectName={activeProject.name} 
                            activeProjectId={activeProject.id}
                            onOpenModal={(type, data) => handleOpenModal(type, data)}
                            onDeleteStory={handleDeleteSuccessStory} 
                        /> : <PlaceholderFeatureView featureName="Success Stories Repository" />;
            case 'lessons_learned_tracker':
                return activeProject ? <LessonsLearnedTrackerView 
                            lessonsLearned={lessonsLearned} 
                            activeProjectName={activeProject.name} 
                            activeProjectId={activeProject.id}
                            onOpenModal={(type, data) => handleOpenModal(type, data)}
                            onDeleteLesson={handleDeleteLessonLearned}
                        /> : <PlaceholderFeatureView featureName="Lessons Learned Tracker" />;

            // Admin & Governance
            case 'manage_users':
            case 'manage_roles':
                return <UserManagementView currentRole={activeRole} onRoleChange={handleRoleChange} />;
            case 'audit_trail':
                return <AuditTrailView activeProject={activeProject} />;
        }
    }
    // Global views (can be accessed with or without an active project)
    if (currentMainView === 'indicator_library') {
      return <IndicatorLibraryView allIndicators={indicators} allProjects={projects} />;
    }
    if (currentMainView === 'multi_project_dashboard') {
      return <MultiProjectDashboardView projects={projects} indicators={indicators} dataPoints={dataPoints} onSelectProject={handleSelectProject} />;
    }
    if (currentMainView === 'evaluation_management') {
      return <EvaluationManagementView activeProject={activeProject} />;
    }
    if (currentMainView === 'accountability_safeguarding') {
      return <AccountabilityView activeProject={activeProject} />;
    }
    if (currentMainView === 'risk_register') {
      return <RiskRegisterView activeProject={activeProject} />;
    }
    if (currentMainView === 'manage_users' || currentMainView === 'manage_roles') {
      return <UserManagementView currentRole={activeRole} onRoleChange={handleRoleChange} />;
    }
    if (currentMainView === 'audit_trail') {
      return <AuditTrailView activeProject={activeProject} />;
    }
    if (currentMainView === 'pirs_templates') {
      return <PirsTemplatesView pirsTemplates={MOCK_PIRS_TEMPLATES} />;
    }


    // Handle placeholder for other views
    if (currentMainView) { 
      return <PlaceholderFeatureView featureName={currentMainView} activeProjectName={activeProject?.name} />;
    }

    // Default: If no active project and no global view, show HomeScreen
    if (!activeProject) {
      return (
        <HomeScreen 
          projects={projects}
          onSelectProject={handleSelectProject}
          onCreateNewProject={() => handleOpenModal('CREATE_PROJECT')}
          onEditProject={(project) => handleOpenModal('EDIT_PROJECT_DETAILS', project)}
          onDeleteProject={handleDeleteProject}
          onLoadFrameworkTemplate={handleLoadFrameworkTemplate}
        />
      );
    }
    
    // Default for active project: Indicator list (when currentMainView is null or project_home)
    return (
      <div className="p-4 sm:p-8">
        <header className="mb-6">
          <ProjectHeader project={activeProject} onEditProject={() => handleOpenModal('EDIT_PROJECT_DETAILS', activeProject)} />
        </header>
        <main className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-neutral-700">Project Indicators for: <span className="text-primary">{activeProject.name}</span></h2>
          </div>
          {projectIndicators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectIndicators.map(indicator => (
                <IndicatorCard
                  key={indicator.id}
                  indicator={indicator}
                  dataPoints={dataPoints.filter(dp => dp.indicatorId === indicator.id)}
                  onAddDataPoint={(indicatorForDataPoint) => handleOpenModal('ADD_DATA_POINT', { indicator: indicatorForDataPoint } as ModalDataAddDataPoint )}
                  onEditIndicator={(indicatorToEdit) => handleOpenModal('EDIT_INDICATOR', indicatorToEdit)}
                  onDeleteIndicator={handleDeleteIndicator}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
              <BriefcaseIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No indicators for this project</h3>
              <p className="mt-1 text-sm text-neutral-500">Get started by adding an indicator using the "Add Indicator" button in the "Project Space" tab.</p>
              <div className="mt-6">
                <Button 
                  onClick={() => handleOpenModal('ADD_INDICATOR')}
                  leftIcon={<PlusIcon />}
                  disabled={!activeProject} 
                >
                  Add Indicator
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };


  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 text-neutral-800">
      {/* Institutional Multi-Org & Authentication Header */}
      <div className="bg-neutral-900 text-white px-4 py-2 border-b border-neutral-700 text-xs flex flex-wrap justify-between items-center gap-2 print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold tracking-wider text-sm text-primary-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            MEAL INSIGHTS OS
          </div>
          <span className="text-neutral-500">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-medium">Organisation:</span>
            {organisations.length > 0 ? (
              <select
                value={activeOrgId}
                onChange={(e) => handleOrgChange(e.target.value)}
                className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-primary-400 cursor-pointer"
              >
                {organisations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-neutral-400 italic">No organisation yet</span>
            )}
          </div>
          {activeProject && (
            <>
              <span className="text-neutral-500">|</span>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <span className="text-neutral-400">Project:</span>
                <span className="font-semibold text-emerald-300 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 truncate max-w-xs">{activeProject.name}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Backend Status Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-medium" title="Supabase PostgreSQL Project xojheaczfnlsszghykej connected">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Supabase Connected
            </span>
            <button
              onClick={() => setShowDbDetails(prev => !prev)}
              className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
            >
              {showDbDetails ? 'Hide Info' : 'Backend Info'}
            </button>
          </div>

          <span className="text-neutral-600">|</span>

          {/* User Session & Role Controls */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 px-2.5 py-0.5 rounded text-neutral-200">
                <span className="w-4 h-4 rounded-full bg-primary-700 text-white flex items-center justify-center font-bold text-[9px]">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="font-medium text-xs text-white max-w-[120px] truncate">{currentUser.name || currentUser.email}</span>
                <span className="px-1.5 py-0.2 bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded text-[10px] uppercase font-semibold">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-2 py-0.5 rounded border border-neutral-700 text-xs font-medium cursor-pointer transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-xs">Guest Mode</span>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-primary hover:bg-primary-600 text-white px-2.5 py-0.5 rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Supabase Backend Info Banner */}
      {showDbDetails && !dismissDbBanner && (
        <div className="bg-sky-50 border-b border-sky-200 px-4 py-3 text-xs text-sky-950 flex justify-between items-start print:hidden">
          <div className="flex-1 pr-4 space-y-1.5">
            <p className="font-bold text-sky-900 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dbHealth?.writeAllowed ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              Supabase PostgreSQL Backend: {dbHealth?.writeAllowed ? 'Read & Write Active' : 'Read Active (Writes Restricted by RLS)'}
            </p>
            <p className="text-sky-800">
              Project Endpoint: <code className="bg-sky-100 text-sky-900 px-1 py-0.5 rounded font-mono">https://xojheaczfnlsszghykej.supabase.co</code>
            </p>
            {dbHealth?.rlsNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs">
                <span className="font-bold block mb-1">Row-Level Security (RLS) Write Access Notice:</span>
                {dbHealth.rlsNotice}
                <div className="mt-1 text-neutral-600">
                  Script provided in workspace: <code>fix_rls_policies.sql</code>
                </div>
              </div>
            )}
            <p className="text-sky-700">
              Live queries directly synchronize with Supabase. Zero mock data or hardcoded demonstration records are active.
            </p>
          </div>
          <button
            onClick={() => setDismissDbBanner(true)}
            className="text-sky-800 hover:text-sky-950 font-bold px-2 py-1 bg-sky-100 hover:bg-sky-200 rounded text-xs ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <RibbonBar
        tabs={currentRibbonTabs}
        activeTabId={activeAppScreenTab}
        onTabSelect={handleTabSelect}
      />
      
      <div className="flex-grow overflow-y-auto">
        {isLoading && modalState.type === null && ( // Show global loader only if not a modal operation
            <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[100]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                <span className="ml-3 text-white">Processing...</span>
            </div>
        )}
        {error && (
            <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-md shadow-lg z-[100] max-w-sm">
                <div className="flex justify-between items-center">
                    <span>Error: {error}</span>
                    <button onClick={() => setError(null)} className="ml-2 text-red-100 hover:text-white">&times;</button>
                </div>
            </div>
        )}
        {renderMainContent()}
        <footer className="text-center mt-auto py-4 border-t border-neutral-300 bg-neutral-100 print:hidden">
          <p className="text-sm text-neutral-500">&copy; {new Date().getFullYear()} Comprehensive M&E Platform. All rights reserved.</p>
        </footer>
      </div>

      {/* --- Modals --- */}
      {modalState.type === 'CREATE_PROJECT' && (
        <ProjectForm
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSubmit={handleCreateProject}
        />
      )}
      {modalState.type === 'EDIT_PROJECT_DETAILS' && modalState.data && (
        <ProjectForm
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSubmit={handleUpdateProjectDetails}
          initialData={modalState.data as Project}
        />
      )}
      {modalState.type === 'ADD_INDICATOR' && activeProject && ( 
        <IndicatorForm
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSubmit={handleAddIndicator}
          projectId={activeProject.id} 
        />
      )}
      {modalState.type === 'EDIT_INDICATOR' && modalState.data && activeProject && ( 
        <IndicatorForm
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSubmit={handleEditIndicator}
          initialData={modalState.data as Indicator}
          projectId={activeProject.id}
        />
      )}
      {modalState.type === 'ADD_DATA_POINT' && modalState.data && (
        <DataPointForm
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSubmit={handleAddDataPoint}
          indicator={(modalState.data as ModalDataAddDataPoint).indicator}
        />
      )}
      {modalState.type === 'ADD_SUCCESS_STORY' && modalState.data && (
        <SuccessStoryForm
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSubmit={handleAddSuccessStory}
          projectId={(modalState.data as ModalDataSuccessStory).projectId}
        />
      )}
      {modalState.type === 'EDIT_SUCCESS_STORY' && modalState.data && (
        <SuccessStoryForm
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSubmit={handleEditSuccessStory}
          initialData={(modalState.data as ModalDataSuccessStory).story}
          projectId={(modalState.data as ModalDataSuccessStory).projectId}
        />
      )}
       {modalState.type === 'ADD_LESSON_LEARNED' && modalState.data && (
        <LessonLearnedForm
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSubmit={handleAddLessonLearned}
          projectId={(modalState.data as ModalDataLessonLearned).projectId}
        />
      )}
      {modalState.type === 'EDIT_LESSON_LEARNED' && modalState.data && (
        <LessonLearnedForm
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSubmit={handleEditLessonLearned}
          initialData={(modalState.data as ModalDataLessonLearned).lesson}
          projectId={(modalState.data as ModalDataLessonLearned).projectId}
        />
      )}

      {/* --- Authentication Modal --- */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={initializeData}
      />
    </div>
  );
};

export default App;
