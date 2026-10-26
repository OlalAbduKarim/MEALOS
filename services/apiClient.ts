/**
 * MEAL INSIGHTS OS — Supabase & Backend API Transport Client
 * 
 * Interacts directly with the Supabase PostgreSQL backend, supporting full CRUD,
 * real-time queries, and seamless offline fallback to mealStorage.
 */

import { supabase, isSupabaseConfigured, testSupabaseConnection } from './supabaseClient';
import { mealStorage } from './mealStorage';
import { 
  Project, Indicator, DataPoint, CollectionForm, FormSubmission, 
  RiskItem, AccountabilityComplaint, Evaluation, MealReport, 
  AuditLog, GeoSite, SuccessStory, LessonLearned, UserProfile, UserRole,
  TheoryOfChangeFramework, LogFrameFramework, ResultsChainFramework, Organisation
} from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: 'supabase' | 'local_cache';
}

class MealApiClient {
  public isConnectedToSupabase(): boolean {
    return isSupabaseConfigured && supabase !== null;
  }

  public async checkHealth(): Promise<{ connected: boolean; message: string }> {
    return testSupabaseConnection();
  }

  // ==================== ORGANISATIONS ====================
  async getOrganisations(): Promise<ApiResponse<Organisation[]>> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('organisations').select('*');
        if (!error && data && data.length > 0) {
          return { success: true, data: data as Organisation[], source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase organisations query fell back to local cache:', e);
      }
    }
    return { success: true, data: mealStorage.getOrganisations(), source: 'local_cache' };
  }

  // ==================== PROJECTS ====================
  async getProjects(orgId?: string): Promise<ApiResponse<Project[]>> {
    if (supabase) {
      try {
        let q = supabase.from('projects').select('*');
        if (orgId) {
          q = q.eq('organisation_id', orgId);
        }
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          const mapped: Project[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description || '',
            startDate: d.start_date,
            endDate: d.end_date,
            organisationId: d.organisation_id,
            code: d.code,
            sector: d.sector,
            location: d.location,
            budget: d.budget ? Number(d.budget) : undefined,
            currency: d.currency,
            status: d.status,
            managerName: d.manager_name
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase projects query fell back to local cache:', e);
      }
    }
    return { success: true, data: mealStorage.getProjects(orgId), source: 'local_cache' };
  }

  async saveProject(project: Project): Promise<ApiResponse<Project>> {
    mealStorage.saveProject(project);
    if (supabase) {
      try {
        const row = {
          id: project.id,
          organisation_id: project.organisationId || 'org_gh_health',
          name: project.name,
          description: project.description,
          start_date: project.startDate,
          end_date: project.endDate,
          code: project.code,
          sector: project.sector,
          location: project.location,
          budget: project.budget,
          currency: project.currency,
          status: project.status || 'Active',
          manager_name: project.managerName,
          updated_at: new Date().toISOString()
        };
        await supabase.from('projects').upsert(row);
      } catch (e) {
        console.warn('[ApiClient] Supabase save project error, saved locally:', e);
      }
    }
    return { success: true, data: project };
  }

  async deleteProject(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    mealStorage.deleteProject(id);
    if (supabase) {
      try {
        await supabase.from('projects').delete().eq('id', id);
      } catch (e) {
        console.warn('[ApiClient] Supabase delete project error:', e);
      }
    }
    return { success: true, data: { deleted: true } };
  }

  // ==================== INDICATORS ====================
  async getIndicators(projectId?: string): Promise<ApiResponse<Indicator[]>> {
    if (supabase) {
      try {
        let q = supabase.from('indicators').select('*');
        if (projectId) {
          q = q.eq('project_id', projectId);
        }
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          const mapped: Indicator[] = data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            code: d.code,
            name: d.name,
            description: d.description || '',
            unitOfMeasure: d.unit_of_measure,
            dataType: d.data_type,
            targetValue: d.target_value,
            baselineValue: d.baseline_value,
            baselineDate: d.baseline_date,
            directionality: d.directionality,
            sector: d.sector,
            frequency: d.frequency,
            responsibleOfficer: d.responsible_officer,
            calculationFormula: d.calculation_formula,
            aggregationType: d.aggregation_type,
            statusThresholds: d.status_thresholds
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase indicators query fell back to local cache:', e);
      }
    }
    return { success: true, data: mealStorage.getIndicators(projectId), source: 'local_cache' };
  }

  async saveIndicator(indicator: Indicator): Promise<ApiResponse<Indicator>> {
    mealStorage.saveIndicator(indicator);
    if (supabase) {
      try {
        const row = {
          id: indicator.id,
          project_id: indicator.projectId,
          code: indicator.code,
          name: indicator.name,
          description: indicator.description,
          unit_of_measure: indicator.unitOfMeasure,
          data_type: indicator.dataType,
          target_value: Number(indicator.targetValue) || 0,
          baseline_value: Number(indicator.baselineValue) || 0,
          baseline_date: indicator.baselineDate || null,
          directionality: indicator.directionality || 'higher_is_better',
          sector: indicator.sector,
          frequency: indicator.frequency,
          responsible_officer: indicator.responsibleOfficer,
          calculation_formula: indicator.calculationFormula,
          aggregation_type: indicator.aggregationType || 'Sum',
          status_thresholds: indicator.statusThresholds
        };
        await supabase.from('indicators').upsert(row);
      } catch (e) {
        console.warn('[ApiClient] Supabase save indicator error:', e);
      }
    }
    return { success: true, data: indicator };
  }

  async deleteIndicator(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    mealStorage.deleteIndicator(id);
    if (supabase) {
      try {
        await supabase.from('indicators').delete().eq('id', id);
      } catch (e) {
        console.warn('[ApiClient] Supabase delete indicator error:', e);
      }
    }
    return { success: true, data: { deleted: true } };
  }

  // ==================== DATA POINTS ====================
  async getDataPoints(indicatorId?: string, projectId?: string): Promise<ApiResponse<DataPoint[]>> {
    if (supabase) {
      try {
        let q = supabase.from('data_points').select('*');
        if (indicatorId) q = q.eq('indicator_id', indicatorId);
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          const mapped: DataPoint[] = data.map((d: any) => ({
            id: d.id,
            indicatorId: d.indicator_id,
            actualValue: d.actual_value,
            collectionDate: d.collection_date,
            notes: d.notes,
            numerator: d.numerator,
            denominator: d.denominator,
            verificationStatus: d.verification_status,
            verifiedBy: d.verified_by,
            tags: d.tags || {},
            disaggregatedValues: d.disaggregated_values || {}
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase data points query fell back to local cache:', e);
      }
    }
    return { success: true, data: mealStorage.getDataPoints(indicatorId), source: 'local_cache' };
  }

  async saveDataPoint(dataPoint: DataPoint): Promise<ApiResponse<DataPoint>> {
    mealStorage.saveDataPoint(dataPoint);
    if (supabase) {
      try {
        const row = {
          id: dataPoint.id,
          indicator_id: dataPoint.indicatorId,
          actual_value: Number(dataPoint.actualValue) || 0,
          collection_date: dataPoint.collectionDate,
          notes: dataPoint.notes,
          numerator: dataPoint.numerator,
          denominator: dataPoint.denominator,
          verification_status: dataPoint.verificationStatus || 'verified',
          verified_by: dataPoint.verifiedBy,
          tags: dataPoint.tags || {},
          disaggregated_values: dataPoint.disaggregatedValues || {}
        };
        await supabase.from('data_points').upsert(row);
      } catch (e) {
        console.warn('[ApiClient] Supabase save data point error:', e);
      }
    }
    return { success: true, data: dataPoint };
  }

  async deleteDataPoint(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    mealStorage.deleteDataPoint(id);
    if (supabase) {
      try {
        await supabase.from('data_points').delete().eq('id', id);
      } catch (e) {
        console.warn('[ApiClient] Supabase delete data point error:', e);
      }
    }
    return { success: true, data: { deleted: true } };
  }

  // ==================== FRAMEWORKS ====================
  async getTheoryOfChange(projectId: string): Promise<TheoryOfChangeFramework | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('theories_of_change').select('*').eq('project_id', projectId).maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            projectId: data.project_id,
            inputs: data.inputs || '',
            activities: data.activities || '',
            outputs: data.outputs || '',
            outcomes: data.outcomes || '',
            impact: data.impact || '',
            assumptions: data.assumptions || '',
            lastUpdated: data.last_updated
          };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase ToC query error:', e);
      }
    }
    return mealStorage.getTheoryOfChange(projectId);
  }

  async saveTheoryOfChange(data: TheoryOfChangeFramework): Promise<void> {
    mealStorage.saveTheoryOfChange(data);
    if (supabase) {
      try {
        await supabase.from('theories_of_change').upsert({
          id: data.id || `toc_${data.projectId}`,
          project_id: data.projectId,
          inputs: data.inputs,
          activities: data.activities,
          outputs: data.outputs,
          outcomes: data.outcomes,
          impact: data.impact,
          assumptions: data.assumptions,
          last_updated: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[ApiClient] Supabase save ToC error:', e);
      }
    }
  }

  async getLogFrame(projectId: string): Promise<LogFrameFramework | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('logical_frameworks').select('*').eq('project_id', projectId).maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            projectId: data.project_id,
            goal: data.goal || '',
            outcomes: data.outcomes || '',
            outputs: data.outputs || '',
            activities: data.activities || '',
            goalIndicators: data.goal_indicators || '',
            outcomeIndicators: data.outcome_indicators || '',
            outputIndicators: data.output_indicators || '',
            activityIndicators: data.activity_indicators || '',
            goalMov: data.goal_mov || '',
            outcomeMov: data.outcome_mov || '',
            outputMov: data.output_mov || '',
            activityMov: data.activity_mov || '',
            goalAssumptions: data.goal_assumptions || '',
            outcomeAssumptions: data.outcome_assumptions || '',
            outputAssumptions: data.output_assumptions || '',
            activityAssumptions: data.activity_assumptions || '',
            lastUpdated: data.last_updated
          };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase LogFrame query error:', e);
      }
    }
    return mealStorage.getLogFrame(projectId);
  }

  async saveLogFrame(data: LogFrameFramework): Promise<void> {
    mealStorage.saveLogFrame(data);
    if (supabase) {
      try {
        await supabase.from('logical_frameworks').upsert({
          id: data.id || `lf_${data.projectId}`,
          project_id: data.projectId,
          goal: data.goal,
          outcomes: data.outcomes,
          outputs: data.outputs,
          activities: data.activities,
          goal_indicators: data.goalIndicators,
          outcome_indicators: data.outcomeIndicators,
          output_indicators: data.outputIndicators,
          activity_indicators: data.activityIndicators,
          goal_mov: data.goalMov,
          outcome_mov: data.outcomeMov,
          output_mov: data.outputMov,
          activity_mov: data.activityMov,
          goal_assumptions: data.goalAssumptions,
          outcome_assumptions: data.outcomeAssumptions,
          output_assumptions: data.outputAssumptions,
          activity_assumptions: data.activityAssumptions,
          last_updated: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[ApiClient] Supabase save LogFrame error:', e);
      }
    }
  }

  async getResultsChain(projectId: string): Promise<ResultsChainFramework | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('results_chains').select('*').eq('project_id', projectId).maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            projectId: data.project_id,
            inputs: data.inputs || '',
            activities: data.activities || '',
            outputs: data.outputs || '',
            shortTermOutcomes: data.short_term_outcomes || '',
            mediumTermOutcomes: data.medium_term_outcomes || '',
            longTermImpact: data.long_term_impact || '',
            lastUpdated: data.last_updated
          };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase Results Chain query error:', e);
      }
    }
    return mealStorage.getResultsChain(projectId);
  }

  async saveResultsChain(data: ResultsChainFramework): Promise<void> {
    mealStorage.saveResultsChain(data);
    if (supabase) {
      try {
        await supabase.from('results_chains').upsert({
          id: data.id || `rc_${data.projectId}`,
          project_id: data.projectId,
          inputs: data.inputs,
          activities: data.activities,
          outputs: data.outputs,
          short_term_outcomes: data.shortTermOutcomes,
          medium_term_outcomes: data.mediumTermOutcomes,
          long_term_impact: data.longTermImpact,
          last_updated: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[ApiClient] Supabase save Results Chain error:', e);
      }
    }
  }

  // ==================== AUDIT LOGS ====================
  async getAuditLogs(organisationId?: string, projectId?: string): Promise<AuditLog[]> {
    if (supabase) {
      try {
        let q = supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
        if (organisationId) q = q.eq('organisation_id', organisationId);
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            organisationId: d.organisation_id,
            projectId: d.project_id,
            actorName: d.actor_name,
            actorRole: d.actor_role,
            action: d.action,
            entityType: d.entity_type,
            entityId: d.entity_id,
            details: d.details || '',
            timestamp: d.timestamp
          }));
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase audit logs query error:', e);
      }
    }
    return mealStorage.getAuditLogs(organisationId, projectId);
  }

  async logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    mealStorage.logAudit(log.organisationId, log.projectId, log.action, log.entityType, log.entityId, log.details);
    if (supabase) {
      try {
        await supabase.from('audit_logs').insert({
          organisation_id: log.organisationId,
          project_id: log.projectId,
          actor_name: log.actorName,
          actor_role: log.actorRole,
          action: log.action,
          entity_type: log.entityType,
          entity_id: log.entityId,
          details: log.details,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[ApiClient] Supabase log audit error:', e);
      }
    }
  }
}

export const mealApiClient = new MealApiClient();
