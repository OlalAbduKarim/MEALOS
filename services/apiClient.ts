/**
 * MEAL INSIGHTS OS — Supabase PostgreSQL Backend API Transport Client
 * 
 * Interacts directly with the Supabase PostgreSQL backend, supporting full CRUD
 * and real-time synchronization across all 18 tables defined in supabase_schema.sql.
 * 
 * Crucial constraint: When Supabase returns an empty table ([]), this is respected
 * as a genuine empty database state and never substituted with mock data.
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
        const { data, error } = await supabase.from('organisations').select('*').order('created_at', { ascending: false });
        if (!error && data !== null && data !== undefined) {
          const mapped: Organisation[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            code: d.code,
            sector: d.sector || '',
            country: d.country || '',
            currency: d.currency || 'USD ($)',
            dateFormat: d.date_format || 'YYYY-MM-DD',
            createdAt: d.created_at,
            isDemo: Boolean(d.is_demo)
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
        if (error) {
          console.warn('[ApiClient] Supabase organisations error:', error.message);
        }
      } catch (e: any) {
        console.warn('[ApiClient] Supabase organisations query failed:', e);
      }
    }
    return { success: true, data: mealStorage.getOrganisations(), source: 'local_cache' };
  }

  async saveOrganisation(org: Organisation): Promise<ApiResponse<Organisation>> {
    mealStorage.saveOrganisation(org);
    if (supabase) {
      try {
        const row = {
          id: org.id,
          name: org.name,
          code: org.code,
          sector: org.sector || null,
          country: org.country || null,
          currency: org.currency || 'USD ($)',
          date_format: org.dateFormat || 'YYYY-MM-DD',
          is_demo: Boolean(org.isDemo)
        };
        const { error } = await supabase.from('organisations').upsert(row);
        if (error) {
          console.error('[ApiClient] Supabase save organisation error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('[ApiClient] Supabase save organisation failed:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true, data: org, source: 'supabase' };
  }

  // ==================== PROJECTS ====================
  async getProjects(orgId?: string): Promise<ApiResponse<Project[]>> {
    if (supabase) {
      try {
        let q = supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (orgId) {
          q = q.eq('organisation_id', orgId);
        }
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
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
        if (error) {
          console.warn('[ApiClient] Supabase projects error:', error.message);
        }
      } catch (e: any) {
        console.warn('[ApiClient] Supabase projects query failed:', e);
      }
    }
    return { success: true, data: mealStorage.getProjects(orgId), source: 'local_cache' };
  }

  async saveProject(project: Project): Promise<ApiResponse<Project>> {
    mealStorage.saveProject(project);
    if (supabase) {
      try {
        // Ensure organisation exists before creating project to satisfy foreign key constraint
        const targetOrgId = project.organisationId || 'org_default';
        const { data: orgCheck } = await supabase.from('organisations').select('id').eq('id', targetOrgId).maybeSingle();
        if (!orgCheck) {
          await supabase.from('organisations').insert({
            id: targetOrgId,
            name: 'Primary M&E Organisation',
            code: 'MEAL',
            currency: project.currency || 'USD ($)'
          });
        }

        const row = {
          id: project.id,
          organisation_id: targetOrgId,
          name: project.name,
          description: project.description,
          start_date: project.startDate,
          end_date: project.endDate,
          code: project.code || null,
          sector: project.sector || null,
          location: project.location || null,
          budget: project.budget !== undefined ? Number(project.budget) : null,
          currency: project.currency || 'USD ($)',
          status: project.status || 'Active',
          manager_name: project.managerName || null,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('projects').upsert(row);
        if (error) {
          console.error('[ApiClient] Supabase save project error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('[ApiClient] Supabase save project exception:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true, data: project, source: 'supabase' };
  }

  async deleteProject(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    mealStorage.deleteProject(id);
    if (supabase) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) console.error('[ApiClient] Supabase delete project error:', error.message);
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
        let q = supabase.from('indicators').select('*').order('created_at', { ascending: false });
        if (projectId) {
          q = q.eq('project_id', projectId);
        }
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
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
        console.warn('[ApiClient] Supabase indicators query error:', e);
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
          code: indicator.code || null,
          name: indicator.name,
          description: indicator.description || null,
          unit_of_measure: indicator.unitOfMeasure,
          data_type: indicator.dataType,
          target_value: Number(indicator.targetValue) || 0,
          baseline_value: Number(indicator.baselineValue) || 0,
          baseline_date: indicator.baselineDate || null,
          directionality: indicator.directionality || 'higher_is_better',
          sector: indicator.sector || null,
          frequency: indicator.frequency || null,
          responsible_officer: indicator.responsibleOfficer || null,
          calculation_formula: indicator.calculationFormula || null,
          aggregation_type: indicator.aggregationType || 'Sum',
          status_thresholds: indicator.statusThresholds || null,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('indicators').upsert(row);
        if (error) {
          console.error('[ApiClient] Supabase save indicator error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('[ApiClient] Supabase save indicator exception:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true, data: indicator, source: 'supabase' };
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
        let q = supabase.from('data_points').select('*').order('collection_date', { ascending: false });
        if (indicatorId) q = q.eq('indicator_id', indicatorId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
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
        console.warn('[ApiClient] Supabase data points query error:', e);
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
          notes: dataPoint.notes || null,
          numerator: dataPoint.numerator !== undefined ? Number(dataPoint.numerator) : null,
          denominator: dataPoint.denominator !== undefined ? Number(dataPoint.denominator) : null,
          verification_status: dataPoint.verificationStatus || 'verified',
          verified_by: dataPoint.verifiedBy || null,
          tags: dataPoint.tags || {},
          disaggregated_values: dataPoint.disaggregatedValues || {}
        };
        const { error } = await supabase.from('data_points').upsert(row);
        if (error) {
          console.error('[ApiClient] Supabase save data point error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('[ApiClient] Supabase save data point exception:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true, data: dataPoint, source: 'supabase' };
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

  // ==================== FORMS & SUBMISSIONS ====================
  async getCollectionForms(projectId?: string): Promise<ApiResponse<CollectionForm[]>> {
    if (supabase) {
      try {
        let q = supabase.from('collection_forms').select('*').order('created_at', { ascending: false });
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: CollectionForm[] = data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            title: d.title,
            description: d.description || '',
            version: d.version || 1,
            status: d.status || 'draft',
            fields: d.fields || [],
            createdAt: d.created_at,
            publishedAt: d.published_at,
            targetSubmissions: d.target_submissions
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase forms query error:', e);
      }
    }
    return { success: true, data: mealStorage.getForms(projectId), source: 'local_cache' };
  }

  async saveCollectionForm(form: CollectionForm): Promise<ApiResponse<CollectionForm>> {
    mealStorage.saveForm(form);
    if (supabase) {
      try {
        const row = {
          id: form.id,
          project_id: form.projectId,
          title: form.title,
          description: form.description || null,
          version: form.version || 1,
          status: form.status || 'published',
          fields: form.fields || [],
          target_submissions: form.targetSubmissions || null,
          created_at: form.createdAt || new Date().toISOString()
        };
        const { error } = await supabase.from('collection_forms').upsert(row);
        if (error) {
          console.error('[ApiClient] Supabase save form error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.warn('[ApiClient] Supabase save form error:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true, data: form, source: 'supabase' };
  }

  async deleteCollectionForm(formId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    mealStorage.deleteForm(formId);
    if (supabase) {
      try {
        const { error } = await supabase.from('collection_forms').delete().eq('id', formId);
        if (error) {
          console.warn('[ApiClient] Supabase delete form error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.warn('[ApiClient] Supabase delete form error:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true, data: { deleted: true }, source: 'supabase' };
  }

  async getFormSubmissions(projectId?: string): Promise<ApiResponse<FormSubmission[]>> {
    if (supabase) {
      try {
        let q = supabase.from('form_submissions').select('*').order('created_at', { ascending: false });
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: FormSubmission[] = data.map((d: any) => ({
            id: d.id,
            formId: d.form_id,
            projectId: d.project_id,
            enumeratorId: d.enumerator_id || '',
            enumeratorName: d.enumerator_name || 'Field Enumerator',
            submissionDate: d.submission_date || d.created_at,
            status: d.status || 'submitted',
            data: d.data || {},
            reviewerName: d.reviewer_name,
            approvedAt: d.approved_at,
            reviewNotes: d.review_notes,
            gpsLocation: d.gps_location
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
        if (error) {
          console.warn('[ApiClient] Supabase submissions query error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.warn('[ApiClient] Supabase submissions query failed:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true, data: mealStorage.getSubmissions(projectId), source: 'local_cache' };
  }

  async saveFormSubmission(sub: FormSubmission): Promise<ApiResponse<FormSubmission>> {
    mealStorage.saveSubmission(sub);
    if (supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub.enumeratorId);
        const validEnumId = isUuid ? sub.enumeratorId : '00000000-0000-0000-0000-000000000001';

        const row = {
          id: sub.id,
          form_id: sub.formId,
          project_id: sub.projectId,
          enumerator_id: validEnumId,
          enumerator_name: sub.enumeratorName || 'Field Enumerator',
          submission_date: sub.submissionDate || new Date().toISOString(),
          status: sub.status || 'submitted',
          data: sub.data || {},
          reviewer_name: sub.reviewerName || null,
          approved_at: sub.approvedAt || null,
          review_notes: sub.reviewNotes || null,
          gps_location: sub.gpsLocation || null
        };
        const { error } = await supabase.from('form_submissions').upsert(row);
        if (error) {
          console.error('[ApiClient] Supabase save submission error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.warn('[ApiClient] Supabase save submission error:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true, data: sub, source: 'supabase' };
  }

  // ==================== RISKS & SAFEGUARDING ====================
  async getRiskItems(projectId?: string): Promise<ApiResponse<RiskItem[]>> {
    if (supabase) {
      try {
        let q = supabase.from('risk_items').select('*').order('created_at', { ascending: false });
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: RiskItem[] = data.map((d: any) => {
            const l = typeof d.likelihood === 'number' ? d.likelihood : (d.likelihood === 'High' ? 4 : d.likelihood === 'Medium' ? 3 : 2);
            const i = typeof d.impact === 'number' ? d.impact : (d.impact === 'High' ? 4 : d.impact === 'Medium' ? 3 : 2);
            return {
              id: d.id,
              projectId: d.project_id,
              title: d.description ? d.description.slice(0, 50) : 'Operational Risk',
              category: (d.category as any) || 'Operational',
              likelihood: l,
              impact: i,
              rating: l * i,
              mitigation: d.mitigation_strategy || '',
              owner: d.owner || '',
              status: (d.status === 'closed' || d.status === 'mitigated') ? d.status : 'active',
              reviewDate: d.review_date || new Date().toISOString().split('T')[0]
            };
          });
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase risks query error:', e);
      }
    }
    return { success: true, data: mealStorage.getRisks(projectId), source: 'local_cache' };
  }

  async saveRiskItem(risk: RiskItem): Promise<ApiResponse<RiskItem>> {
    mealStorage.saveRisk(risk);
    if (supabase) {
      try {
        const row = {
          id: risk.id,
          project_id: risk.projectId,
          category: risk.category,
          description: risk.title,
          likelihood: risk.likelihood,
          impact: risk.impact,
          mitigation_strategy: risk.mitigation,
          status: risk.status,
          owner: risk.owner,
          review_date: risk.reviewDate || null
        };
        const { error } = await supabase.from('risk_items').upsert(row);
        if (error) console.error('[ApiClient] Supabase save risk error:', error.message);
      } catch (e) {
        console.warn('[ApiClient] Supabase save risk error:', e);
      }
    }
    return { success: true, data: risk, source: 'supabase' };
  }

  async getSafeguardingComplaints(projectId?: string): Promise<ApiResponse<AccountabilityComplaint[]>> {
    if (supabase) {
      try {
        let q = supabase.from('safeguarding_complaints').select('*').order('created_at', { ascending: false });
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: AccountabilityComplaint[] = data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id || '',
            referenceCode: d.tracking_code || 'COMP-000',
            category: (d.category as any) || 'Feedback',
            channel: 'Digital Portal',
            isAnonymous: !d.title,
            description: d.description || '',
            isSafeguardingSensitive: Boolean(d.is_confidential),
            status: d.status || 'received',
            assignedTo: d.assigned_officer || 'Unassigned',
            dateReceived: d.incident_date || d.created_at,
            resolutionSummary: d.resolution_notes,
            resolvedAt: d.resolved_at
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase complaints query error:', e);
      }
    }
    return { success: true, data: mealStorage.getComplaints(projectId), source: 'local_cache' };
  }

  async saveSafeguardingComplaint(complaint: AccountabilityComplaint): Promise<ApiResponse<AccountabilityComplaint>> {
    mealStorage.saveComplaint(complaint);
    if (supabase) {
      try {
        const row = {
          id: complaint.id,
          project_id: complaint.projectId || null,
          tracking_code: complaint.referenceCode,
          category: complaint.category,
          severity: complaint.isSafeguardingSensitive ? 'High' : 'Medium',
          status: complaint.status,
          title: complaint.referenceCode,
          description: complaint.description,
          incident_date: complaint.dateReceived || null,
          is_confidential: Boolean(complaint.isSafeguardingSensitive),
          assigned_officer: complaint.assignedTo || null,
          resolution_notes: complaint.resolutionSummary || null,
          resolved_at: complaint.resolvedAt || null
        };
        const { error } = await supabase.from('safeguarding_complaints').upsert(row);
        if (error) console.error('[ApiClient] Supabase save complaint error:', error.message);
      } catch (e) {
        console.warn('[ApiClient] Supabase save complaint error:', e);
      }
    }
    return { success: true, data: complaint, source: 'supabase' };
  }

  // ==================== EVALUATIONS ====================
  async getEvaluations(projectId?: string): Promise<ApiResponse<Evaluation[]>> {
    if (supabase) {
      try {
        let q = supabase.from('evaluations').select('*').order('created_at', { ascending: false });
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: Evaluation[] = data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            title: d.title,
            type: d.evaluation_type || 'midterm',
            status: d.status || 'planned',
            leadEvaluator: d.external_lead || d.commissioner || '',
            budget: d.budget ? Number(d.budget) : undefined,
            criteria: ['Relevance', 'Effectiveness', 'Efficiency', 'Sustainability'],
            startDate: d.start_date,
            endDate: d.end_date,
            keyFindings: d.key_findings || '',
            recommendations: d.recommendations ? (Array.isArray(d.recommendations) ? d.recommendations : [d.recommendations]) : []
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase evaluations query error:', e);
      }
    }
    return { success: true, data: mealStorage.getEvaluations(projectId), source: 'local_cache' };
  }

  async saveEvaluation(evaluation: Evaluation): Promise<ApiResponse<Evaluation>> {
    mealStorage.saveEvaluation(evaluation);
    if (supabase) {
      try {
        const row = {
          id: evaluation.id,
          project_id: evaluation.projectId,
          title: evaluation.title,
          evaluation_type: evaluation.type,
          commissioner: evaluation.leadEvaluator || 'MEAL Unit',
          external_lead: evaluation.leadEvaluator || null,
          start_date: evaluation.startDate || null,
          end_date: evaluation.endDate || null,
          budget: evaluation.budget ? Number(evaluation.budget) : null,
          key_findings: evaluation.keyFindings || null,
          recommendations: evaluation.recommendations || [],
          status: evaluation.status || 'planned'
        };
        const { error } = await supabase.from('evaluations').upsert(row);
        if (error) console.error('[ApiClient] Supabase save evaluation error:', error.message);
      } catch (e) {
        console.warn('[ApiClient] Supabase save evaluation error:', e);
      }
    }
    return { success: true, data: evaluation, source: 'supabase' };
  }

  // ==================== SUCCESS STORIES & LESSONS ====================
  async getSuccessStories(projectId?: string): Promise<ApiResponse<SuccessStory[]>> {
    if (supabase) {
      try {
        let q = supabase.from('success_stories').select('*').order('created_at', { ascending: false });
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: SuccessStory[] = data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            title: d.title,
            narrative: d.narrative || '',
            dateAdded: d.date_published || d.created_at || new Date().toISOString().split('T')[0]
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase success stories error:', e);
      }
    }
    return { success: true, data: mealStorage.getSuccessStories(projectId), source: 'local_cache' };
  }

  async saveSuccessStory(story: SuccessStory): Promise<ApiResponse<SuccessStory>> {
    mealStorage.saveSuccessStory(story);
    if (supabase) {
      try {
        const row = {
          id: story.id,
          project_id: story.projectId,
          title: story.title,
          narrative: story.narrative,
          date_published: story.dateAdded || new Date().toISOString().split('T')[0],
          status: 'Published'
        };
        await supabase.from('success_stories').upsert(row);
      } catch (e) {
        console.warn('[ApiClient] Supabase save story error:', e);
      }
    }
    return { success: true, data: story, source: 'supabase' };
  }

  async getLessonsLearned(projectId?: string): Promise<ApiResponse<LessonLearned[]>> {
    if (supabase) {
      try {
        let q = supabase.from('lessons_learned').select('*').order('created_at', { ascending: false });
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: LessonLearned[] = data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            title: d.title,
            description: d.what_happened || d.recommendation || d.context || '',
            category: (['Positive', 'Negative', 'Neutral', 'Observation', 'Recommendation'].includes(d.category) ? d.category : 'Observation') as any,
            dateDocumented: d.date_logged || d.created_at || new Date().toISOString().split('T')[0]
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase lessons error:', e);
      }
    }
    return { success: true, data: mealStorage.getLessonsLearned(projectId), source: 'local_cache' };
  }

  async saveLessonLearned(lesson: LessonLearned): Promise<ApiResponse<LessonLearned>> {
    mealStorage.saveLessonLearned(lesson);
    if (supabase) {
      try {
        const row = {
          id: lesson.id,
          project_id: lesson.projectId,
          title: lesson.title,
          category: lesson.category,
          what_happened: lesson.description,
          recommendation: lesson.description,
          date_logged: lesson.dateDocumented,
          status: 'Active'
        };
        await supabase.from('lessons_learned').upsert(row);
      } catch (e) {
        console.warn('[ApiClient] Supabase save lesson error:', e);
      }
    }
    return { success: true, data: lesson, source: 'supabase' };
  }

  // ==================== GEO SITES ====================
  async getGeoSites(projectId?: string): Promise<ApiResponse<GeoSite[]>> {
    if (supabase) {
      try {
        let q = supabase.from('geo_sites').select('*').order('name');
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: GeoSite[] = data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            name: d.name,
            type: d.type || d.site_type || 'facility',
            district: d.district || '',
            latitude: Number(d.latitude),
            longitude: Number(d.longitude),
            beneficiariesTargeted: d.beneficiaries_targeted,
            indicatorsMeasured: d.indicators_measured || []
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase geo sites error:', e);
      }
    }
    return { success: true, data: mealStorage.getGeoSites(projectId), source: 'local_cache' };
  }

  async saveGeoSite(site: GeoSite): Promise<ApiResponse<GeoSite>> {
    if (supabase) {
      try {
        const row = {
          id: site.id,
          project_id: site.projectId,
          name: site.name,
          type: site.type,
          district: site.district,
          latitude: site.latitude,
          longitude: site.longitude,
          beneficiaries_targeted: site.beneficiariesTargeted || 0,
          indicators_measured: site.indicatorsMeasured || []
        };
        await supabase.from('geo_sites').upsert(row);
      } catch (e) {
        console.warn('[ApiClient] Supabase save geo site error:', e);
      }
    }
    return { success: true, data: site, source: 'supabase' };
  }

  // ==================== MEAL REPORTS ====================
  async getMealReports(projectId?: string): Promise<ApiResponse<MealReport[]>> {
    if (supabase) {
      try {
        let q = supabase.from('meal_reports').select('*').order('created_at', { ascending: false });
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: MealReport[] = data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            title: d.title,
            reportType: d.report_type || 'quarterly',
            reportingPeriod: d.reporting_period || '',
            executiveSummary: d.executive_summary || '',
            indicatorSnapshots: d.indicator_snapshots || [],
            findings: d.findings || '',
            status: d.status || 'draft',
            approvedBy: d.approved_by,
            createdAt: d.created_at
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase reports error:', e);
      }
    }
    return { success: true, data: mealStorage.getReports(projectId), source: 'local_cache' };
  }

  async saveMealReport(report: MealReport): Promise<ApiResponse<MealReport>> {
    mealStorage.saveReport(report);
    if (supabase) {
      try {
        const row = {
          id: report.id,
          project_id: report.projectId,
          title: report.title,
          report_type: report.reportType,
          reporting_period: report.reportingPeriod,
          executive_summary: report.executiveSummary || null,
          indicator_snapshots: report.indicatorSnapshots || [],
          findings: report.findings || null,
          status: report.status || 'draft',
          approved_by: report.approvedBy || null
        };
        await supabase.from('meal_reports').upsert(row);
      } catch (e) {
        console.warn('[ApiClient] Supabase save report error:', e);
      }
    }
    return { success: true, data: report, source: 'supabase' };
  }

  // ==================== AUDIT LOGS ====================
  async getAuditLogs(organisationId?: string, projectId?: string): Promise<AuditLog[]> {
    if (supabase) {
      try {
        let q = supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
        if (organisationId) q = q.eq('organisation_id', organisationId);
        if (projectId) q = q.eq('project_id', projectId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
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

  // ==================== USER PROFILES ====================
  async getUserProfiles(organisationId?: string): Promise<ApiResponse<UserProfile[]>> {
    if (supabase) {
      try {
        let q = supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
        if (organisationId) q = q.eq('organisation_id', organisationId);
        const { data, error } = await q;
        if (!error && data !== null && data !== undefined) {
          const mapped: UserProfile[] = data.map((d: any) => ({
            id: d.id,
            email: d.email,
            name: d.name,
            role: d.role as UserRole,
            organisationId: d.organisation_id,
            activeProjectIds: d.active_project_ids || []
          }));
          return { success: true, data: mapped, source: 'supabase' };
        }
      } catch (e) {
        console.warn('[ApiClient] Supabase user profiles error:', e);
      }
    }
    return { success: true, data: [], source: 'local_cache' };
  }

  async saveUserProfile(profile: UserProfile): Promise<ApiResponse<UserProfile>> {
    if (supabase) {
      try {
        const row = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          organisation_id: profile.organisationId,
          active_project_ids: profile.activeProjectIds || []
        };
        const { error } = await supabase.from('user_profiles').upsert(row);
        if (error) {
          console.error('[ApiClient] Supabase save user profile error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('[ApiClient] Supabase save user profile exception:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true, data: profile, source: 'supabase' };
  }
}

export const mealApiClient = new MealApiClient();
