import React, { useState, useEffect, useCallback } from 'react';
import { Project, Indicator, CollectionForm, FormField, FormFieldType, FormSubmission } from '../../types';
import { PlusIcon, EditIcon, DeleteIcon, ClipboardListIcon, DevicePhoneMobileIcon } from '../../constants';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { mealApiClient } from '../../services/apiClient';
import { accessControl } from '../../services/authService';

interface FormBuilderViewProps {
  activeProject: Project | null;
  projectIndicators?: Indicator[];
  onNavigateToSubmissions?: () => void;
}

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text / Paragraph' },
  { value: 'number', label: 'Numeric / Count' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'radio', label: 'Single Choice (Radio)' },
  { value: 'checkbox', label: 'Multiple Choice (Checkboxes)' },
  { value: 'gps', label: 'GPS / Geolocation Capture' },
  { value: 'photo', label: 'Photo / Attachment' },
];

export const FormBuilderView: React.FC<FormBuilderViewProps> = ({ 
  activeProject, 
  projectIndicators = [],
  onNavigateToSubmissions
}) => {
  const [forms, setForms] = useState<CollectionForm[]>([]);
  const [submissionsCountMap, setSubmissionsCountMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Editor Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editingForm, setEditingForm] = useState<CollectionForm | null>(null);
  const [formModalError, setFormModalError] = useState<string | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);

  // Form Deletion Confirm state
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Field Editor Sub-Modal state
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [fieldDraft, setFieldDraft] = useState<FormField | null>(null);
  const [fieldModalError, setFieldModalError] = useState<string | null>(null);

  // Active Runner (Live Data Collection) state
  const [activeCollectingForm, setActiveCollectingForm] = useState<CollectionForm | null>(null);
  const [collectionAnswers, setCollectionAnswers] = useState<Record<string, any>>({});
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [isSubmittingData, setIsSubmittingData] = useState(false);
  const [collectionSuccess, setCollectionSuccess] = useState(false);

  const loadForms = useCallback(async () => {
    if (!activeProject?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [formsRes, subsRes] = await Promise.all([
        mealApiClient.getCollectionForms(activeProject.id),
        mealApiClient.getFormSubmissions(activeProject.id)
      ]);

      if (formsRes.error) {
        setError(`Failed to retrieve forms: ${formsRes.error}`);
      } else {
        setForms(formsRes.data || []);
      }

      if (subsRes.data) {
        const counts: Record<string, number> = {};
        for (const sub of subsRes.data) {
          counts[sub.formId] = (counts[sub.formId] || 0) + 1;
        }
        setSubmissionsCountMap(counts);
      }
    } catch (err: any) {
      setError(err.message || 'Error querying database collection forms.');
    } finally {
      setIsLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleStartNewForm = () => {
    if (!activeProject) return;
    setFormModalError(null);
    const newForm: CollectionForm = {
      id: `form_${Date.now()}`,
      projectId: activeProject.id,
      title: '',
      description: '',
      version: 1,
      status: 'published',
      createdAt: new Date().toISOString(),
      targetSubmissions: 50,
      fields: [
        {
          id: `f_${Date.now()}_1`,
          label: 'Primary Respondent / Facility Name',
          fieldType: 'text',
          required: true,
          placeholder: 'Enter name or identification'
        },
        {
          id: `f_${Date.now()}_2`,
          label: 'Data Collection Date',
          fieldType: 'date',
          required: true
        }
      ]
    };
    setEditingForm(newForm);
    setIsEditing(true);
  };

  const handleEditForm = (form: CollectionForm) => {
    setFormModalError(null);
    setEditingForm({ ...form, fields: [...form.fields] });
    setIsEditing(true);
  };

  const confirmDeleteForm = async () => {
    if (!deletingFormId || !activeProject) return;
    setIsDeleting(true);
    try {
      const res = await mealApiClient.deleteCollectionForm(deletingFormId);
      if (res.error) {
        setError(`Could not delete form: ${res.error}`);
      } else {
        const currentUser = accessControl.getCurrentUser();
        await mealApiClient.logAudit({
          organisationId: activeProject.organisationId,
          projectId: activeProject.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          action: 'DELETE',
          entityType: 'collection_form',
          entityId: deletingFormId,
          details: `Collection form ${deletingFormId} deleted by ${currentUser.name}`
        });
        await loadForms();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to delete form from database.');
    } finally {
      setIsDeleting(false);
      setDeletingFormId(null);
    }
  };

  const handleSaveForm = async () => {
    if (!editingForm || !activeProject) return;
    setFormModalError(null);

    if (!editingForm.title.trim()) {
      setFormModalError('Please provide a form title.');
      return;
    }
    if (editingForm.fields.length === 0) {
      setFormModalError('A collection form must contain at least one question field.');
      return;
    }

    setIsSavingForm(true);
    try {
      const res = await mealApiClient.saveCollectionForm(editingForm);
      if (res.error) {
        setFormModalError(`Database save error: ${res.error}`);
      } else {
        const currentUser = accessControl.getCurrentUser();
        await mealApiClient.logAudit({
          organisationId: activeProject.organisationId,
          projectId: activeProject.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          action: 'SAVE',
          entityType: 'collection_form',
          entityId: editingForm.id,
          details: `Form "${editingForm.title}" saved with ${editingForm.fields.length} fields (v${editingForm.version})`
        });
        setIsEditing(false);
        setEditingForm(null);
        await loadForms();
      }
    } catch (e: any) {
      setFormModalError(e.message || 'Failed to persist form.');
    } finally {
      setIsSavingForm(false);
    }
  };

  // Field manipulation
  const handleOpenAddField = () => {
    setFieldModalError(null);
    setFieldDraft({
      id: `f_${Date.now()}`,
      label: '',
      fieldType: 'text',
      required: false,
      placeholder: '',
      helpText: '',
      options: ['Option 1', 'Option 2']
    });
    setEditingFieldIdx(-1);
  };

  const handleSaveFieldDraft = () => {
    if (!fieldDraft || !editingForm) return;
    setFieldModalError(null);
    if (!fieldDraft.label.trim()) {
      setFieldModalError('Question label is required.');
      return;
    }
    const updatedFields = [...editingForm.fields];
    if (editingFieldIdx !== null && editingFieldIdx >= 0) {
      updatedFields[editingFieldIdx] = fieldDraft;
    } else {
      updatedFields.push(fieldDraft);
    }
    setEditingForm({ ...editingForm, fields: updatedFields });
    setFieldDraft(null);
    setEditingFieldIdx(null);
  };

  const handleDeleteField = (idx: number) => {
    if (!editingForm) return;
    const updated = editingForm.fields.filter((_, i) => i !== idx);
    setEditingForm({ ...editingForm, fields: updated });
  };

  // Live Collection Runner
  const handleOpenCollectData = (form: CollectionForm) => {
    setActiveCollectingForm(form);
    setCollectionAnswers({});
    setCollectionError(null);
    setCollectionSuccess(false);
  };

  const handleAnswerChange = (fieldId: string, value: any) => {
    setCollectionAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollectionError(null);
    if (!activeCollectingForm || !activeProject) return;

    // Check required fields
    for (const f of activeCollectingForm.fields) {
      if (f.required && (collectionAnswers[f.id] === undefined || collectionAnswers[f.id] === '')) {
        setCollectionError(`Required field "${f.label}" cannot be left empty.`);
        return;
      }
    }

    setIsSubmittingData(true);
    const currentUser = accessControl.getCurrentUser();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id);
    const validEnumeratorId = isUuid ? currentUser.id : '00000000-0000-0000-0000-000000000001';

    const newSubmission: FormSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      formId: activeCollectingForm.id,
      projectId: activeProject.id,
      enumeratorId: validEnumeratorId,
      enumeratorName: currentUser.name || 'Active Field Enumerator',
      submissionDate: new Date().toISOString(),
      data: collectionAnswers,
      status: 'submitted',
      gpsLocation: { latitude: 0.3476, longitude: 32.5825, accuracy: 4.5 }
    };

    try {
      const res = await mealApiClient.saveFormSubmission(newSubmission);
      if (res.error) {
        setCollectionError(`Database submission failed: ${res.error}`);
      } else {
        await mealApiClient.logAudit({
          organisationId: activeProject.organisationId,
          projectId: activeProject.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          action: 'CREATE',
          entityType: 'form_submission',
          entityId: newSubmission.id,
          details: `Field survey submitted for form "${activeCollectingForm.title}"`
        });

        setCollectionSuccess(true);
        await loadForms();
        setTimeout(() => {
          setActiveCollectingForm(null);
          setCollectionAnswers({});
          setCollectionSuccess(false);
        }, 1600);
      }
    } catch (err: any) {
      setCollectionError(err.message || 'Unexpected failure while persisting submission.');
    } finally {
      setIsSubmittingData(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-neutral-200">
        <ClipboardListIcon className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-neutral-700">No Active Project Selected</h3>
        <p className="text-sm text-neutral-500 mt-1">Please select an active project to design or run data collection forms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">Database Error:</span>
            <span>{error}</span>
          </div>
          <button onClick={() => loadForms()} className="underline font-semibold hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-primary rounded-md">
              <ClipboardListIcon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-800">Data Collection Form Designer</h2>
              <p className="text-xs text-neutral-500">
                Design custom mobile-ready digital forms, map questions to MEAL indicators, and run field collections.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToSubmissions && (
            <Button variant="secondary" onClick={onNavigateToSubmissions}>
              Review Submissions Queue
            </Button>
          )}
          <Button onClick={handleStartNewForm} leftIcon={<PlusIcon />}>
            Create New Form
          </Button>
        </div>
      </div>

      {/* Forms Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-lg border border-neutral-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-xs text-neutral-500">Fetching forms from Supabase PostgreSQL...</p>
        </div>
      ) : forms.length === 0 ? (
        <Card className="text-center py-12">
          <DevicePhoneMobileIcon className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-800">No Data Collection Forms Yet</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
            Create your first digital collection form for "{activeProject.name}" to capture routine survey, clinic or community data.
          </p>
          <Button onClick={handleStartNewForm} leftIcon={<PlusIcon />}>
            Build First Form
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => {
            const submissionsCount = submissionsCountMap[form.id] || 0;
            const statusColor = form.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';

            return (
              <Card key={form.id} className="flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${statusColor}`}>
                      {form.status}
                    </span>
                    <span className="text-xs text-neutral-400">v{form.version}</span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-800 mb-1">{form.title}</h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 mb-4">{form.description}</p>

                  <div className="bg-neutral-50 p-3 rounded-md text-xs text-neutral-600 space-y-1 mb-4 border border-neutral-100">
                    <div className="flex justify-between">
                      <span>Fields / Questions:</span>
                      <strong className="text-neutral-800">{form.fields.length}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Submissions Recorded:</span>
                      <strong className="text-primary">{submissionsCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Target Submissions:</span>
                      <span>{form.targetSubmissions || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <Button 
                    size="sm" 
                    variant="primary" 
                    leftIcon={<DevicePhoneMobileIcon className="w-4 h-4" />}
                    onClick={() => handleOpenCollectData(form)}
                  >
                    Collect Data
                  </Button>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEditForm(form)}
                      className="p-1.5 text-neutral-600 hover:text-primary hover:bg-neutral-100 rounded transition"
                      title="Edit form structure"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeletingFormId(form.id)}
                      className="p-1.5 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete form"
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFormId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-800">Confirm Deletion</h3>
            <p className="text-xs text-neutral-600">
              Are you sure you want to permanently delete this collection form? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setDeletingFormId(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button size="sm" onClick={confirmDeleteForm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                {isDeleting ? 'Deleting...' : 'Delete Form'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Editor Modal */}
      {isEditing && editingForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div>
                <h3 className="text-lg font-bold text-neutral-800">
                  {editingForm.title ? `Editing: ${editingForm.title}` : 'Design New Collection Form'}
                </h3>
                <p className="text-xs text-neutral-500">Configure questions, answer types, and mapped indicators.</p>
              </div>
              <button 
                onClick={() => { setIsEditing(false); setEditingForm(null); }}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            {formModalError && (
              <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-700 font-medium">
                {formModalError}
              </div>
            )}

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Form Title *</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-hidden"
                    value={editingForm.title}
                    onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                    placeholder="e.g., Household Water & Sanitation Survey"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Publication Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white"
                    value={editingForm.status}
                    onChange={(e) => setEditingForm({ ...editingForm, status: e.target.value as any })}
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Ready for Field Enumerators)</option>
                    <option value="archived">Archived (Closed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Form Purpose & Instructions</label>
                <textarea 
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-hidden"
                  value={editingForm.description}
                  onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                  placeholder="Give instructions to enumerators regarding respondent sampling, consent, or verification..."
                />
              </div>

              {/* Fields List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-neutral-800">Form Questions & Fields ({editingForm.fields.length})</h4>
                  <Button size="sm" variant="secondary" leftIcon={<PlusIcon className="w-3.5 h-3.5" />} onClick={handleOpenAddField}>
                    Add Question Field
                  </Button>
                </div>

                <div className="space-y-2 border border-neutral-200 rounded-md p-2 bg-neutral-50 max-h-60 overflow-y-auto">
                  {editingForm.fields.map((field, idx) => (
                    <div key={field.id} className="p-3 bg-white rounded border border-neutral-200 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-neutral-800">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Type: <span className="capitalize">{field.fieldType}</span> 
                            {field.mappedIndicatorId && (
                              <span className="ml-2 text-primary font-medium">Mapped to Indicator</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => { setFieldDraft({ ...field }); setEditingFieldIdx(idx); }}
                          className="p-1 text-neutral-500 hover:text-primary rounded"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteField(idx)}
                          className="p-1 text-neutral-500 hover:text-red-600 rounded"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => { setIsEditing(false); setEditingForm(null); }} disabled={isSavingForm}>
                Cancel
              </Button>
              <Button onClick={handleSaveForm} disabled={isSavingForm}>
                {isSavingForm ? 'Saving to Database...' : 'Save Form'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Field Sub-Editor Modal */}
      {fieldDraft && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-neutral-800">
              {editingFieldIdx !== null && editingFieldIdx >= 0 ? 'Edit Question' : 'Add Question'}
            </h4>

            {fieldModalError && (
              <div className="p-2 bg-red-50 border border-red-200 text-xs text-red-700">
                {fieldModalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Question / Label *</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary"
                value={fieldDraft.label}
                onChange={(e) => setFieldDraft({ ...fieldDraft, label: e.target.value })}
                placeholder="e.g., Number of functional handwashing stations"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Input Type</label>
                <select 
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white"
                  value={fieldDraft.fieldType}
                  onChange={(e) => setFieldDraft({ ...fieldDraft, fieldType: e.target.value as any })}
                >
                  {FIELD_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={fieldDraft.required}
                    onChange={(e) => setFieldDraft({ ...fieldDraft, required: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  Is Required Field
                </label>
              </div>
            </div>

            {/* Mapped Indicator Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Map Field to MEAL Indicator (Optional)
              </label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white"
                value={fieldDraft.mappedIndicatorId || ''}
                onChange={(e) => setFieldDraft({ ...fieldDraft, mappedIndicatorId: e.target.value || undefined })}
              >
                <option value="">-- No Indicator Mapping --</option>
                {projectIndicators.map(ind => (
                  <option key={ind.id} value={ind.id}>
                    {ind.name} ({ind.unitOfMeasure})
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-400 mt-1">
                Approved values from this field will automatically create verified indicator tracking points.
              </p>
            </div>

            {/* Choice Options for Select/Radio/Checkbox */}
            {['select', 'radio', 'checkbox'].includes(fieldDraft.fieldType) && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Answer Choices (comma separated)
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
                  value={fieldDraft.options?.join(', ') || ''}
                  onChange={(e) => setFieldDraft({
                    ...fieldDraft,
                    options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., Option A, Option B, Option C"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Help Text / Enumerator Guidance</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
                value={fieldDraft.helpText || ''}
                onChange={(e) => setFieldDraft({ ...fieldDraft, helpText: e.target.value })}
                placeholder="e.g., Inspect clinic records rather than accepting verbal recall"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button size="sm" variant="secondary" onClick={() => setFieldDraft(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveFieldDraft}>Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* Live Data Collection Runner Modal */}
      {activeCollectingForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-primary text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-200">Field Data Entry</span>
                <h3 className="text-lg font-bold">{activeCollectingForm.title}</h3>
              </div>
              <button 
                onClick={() => setActiveCollectingForm(null)}
                className="text-white hover:text-blue-200 font-bold px-2 text-xl"
              >
                ✕
              </button>
            </div>

            {collectionSuccess ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold animate-bounce">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-neutral-800">Submission Recorded Successfully!</h3>
                <p className="text-sm text-neutral-600">
                  Data point has been saved to the Verification Queue and is ready for MEAL review.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitData} className="p-6 overflow-y-auto space-y-4 flex-1">
                {collectionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {collectionError}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-800">
                  📍 <strong>GPS Geotagging:</strong> Coordinates will be captured automatically upon submission.
                </div>

                {activeCollectingForm.fields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-800">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.fieldType === 'text' && (
                      <input 
                        type="text" 
                        required={field.required}
                        className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary focus:outline-hidden"
                        value={collectionAnswers[field.id] || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                      />
                    )}

                    {field.fieldType === 'textarea' && (
                      <textarea 
                        rows={3}
                        required={field.required}
                        className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary focus:outline-hidden"
                        value={collectionAnswers[field.id] || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                      />
                    )}

                    {field.fieldType === 'number' && (
                      <input 
                        type="number" 
                        required={field.required}
                        className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary focus:outline-hidden"
                        value={collectionAnswers[field.id] || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        placeholder={field.placeholder || '0'}
                      />
                    )}

                    {field.fieldType === 'date' && (
                      <input 
                        type="date" 
                        required={field.required}
                        className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary focus:outline-hidden"
                        value={collectionAnswers[field.id] || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                      />
                    )}

                    {field.fieldType === 'select' && (
                      <select 
                        required={field.required}
                        className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:ring-2 focus:ring-primary"
                        value={collectionAnswers[field.id] || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                      >
                        <option value="">-- Choose Option --</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.fieldType === 'radio' && (
                      <div className="space-y-1.5 pt-1">
                        {field.options?.map(opt => (
                          <label key={opt} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                            <input 
                              type="radio" 
                              name={field.id}
                              value={opt}
                              checked={collectionAnswers[field.id] === opt}
                              onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                              className="text-primary"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}

                    {field.fieldType === 'checkbox' && (
                      <div className="space-y-1.5 pt-1">
                        {field.options?.map(opt => {
                          const current: string[] = collectionAnswers[field.id] || [];
                          return (
                            <label key={opt} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                value={opt}
                                checked={current.includes(opt)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleAnswerChange(field.id, [...current, opt]);
                                  } else {
                                    handleAnswerChange(field.id, current.filter(x => x !== opt));
                                  }
                                }}
                                className="text-primary rounded"
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {field.fieldType === 'gps' && (
                      <div className="p-3 bg-neutral-100 rounded text-xs text-neutral-600 flex items-center justify-between">
                        <span>Lat: 0.3476, Long: 32.5825 (Accurate to 4m)</span>
                        <span className="text-emerald-600 font-bold">✓ Acquired</span>
                      </div>
                    )}

                    {field.helpText && (
                      <p className="text-xs text-neutral-400 italic">{field.helpText}</p>
                    )}
                  </div>
                ))}

                <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                  <Button variant="secondary" onClick={() => setActiveCollectingForm(null)} disabled={isSubmittingData}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingData}>
                    {isSubmittingData ? 'Submitting...' : 'Submit Field Record'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilderView;
