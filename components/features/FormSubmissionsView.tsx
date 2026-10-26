import React, { useState } from 'react';
import { Project, FormSubmission, CollectionForm, Indicator, DataPoint } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ClipboardListIcon, CheckIcon, CloseIcon, EyeIcon } from '../../constants';
import { mealStorage } from '../../services/mealStorage';
import { accessControl } from '../../services/authService';

interface FormSubmissionsViewProps {
  activeProject: Project | null;
  projectIndicators: Indicator[];
  onAddDataPoint?: (dataPoint: Omit<DataPoint, 'id'>) => Promise<void> | void;
}

export const FormSubmissionsView: React.FC<FormSubmissionsViewProps> = ({ 
  activeProject,
  projectIndicators = [],
  onAddDataPoint
}) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(() => {
    return mealStorage.getSubmissions(activeProject?.id);
  });
  const [forms] = useState<CollectionForm[]>(() => {
    return mealStorage.getForms(activeProject?.id);
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<FormSubmission | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const reloadSubmissions = () => {
    setSubmissions(mealStorage.getSubmissions(activeProject?.id));
  };

  const handleUpdateStatus = async (sub: FormSubmission, newStatus: FormSubmission['status']) => {
    if (newStatus === 'approved') {
      const approvalCheck = accessControl.canApproveSubmission(sub);
      if (!approvalCheck.allowed) {
        alert(`Access Denied: ${approvalCheck.reason}`);
        return;
      }
    }

    const currentActor = accessControl.getCurrentUser().name;
    mealStorage.updateSubmissionStatus(sub.id, newStatus, reviewNote || undefined, currentActor);

    // If approved, check if form has fields mapped to indicators, and auto-generate verified data points!
    if (newStatus === 'approved') {
      const parentForm = forms.find(f => f.id === sub.formId);
      if (parentForm) {
        for (const field of parentForm.fields) {
          if (field.mappedIndicatorId && sub.data[field.id] !== undefined) {
            const rawVal = sub.data[field.id];
            const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));
            const actualVal = !isNaN(numVal) ? numVal : String(rawVal);

            if (onAddDataPoint) {
              await onAddDataPoint({
                indicatorId: field.mappedIndicatorId,
                actualValue: actualVal,
                collectionDate: sub.submissionDate.split('T')[0],
                notes: `Auto-verified from Form Submission #${sub.id} (${parentForm.title}). Review: ${reviewNote || 'Approved'}`,
                verificationStatus: 'verified',
                verifiedBy: 'MEAL Reviewer',
                submissionId: sub.id,
                tags: { source: 'digital_form', enumerator: sub.enumeratorName }
              });
            }
          }
        }
      }
    }

    reloadSubmissions();
    setSelectedSub(null);
    setReviewNote('');
  };

  const filtered = submissions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  if (!activeProject) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <p className="text-neutral-600">Please select an active project to view submissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800">Field Submissions & Verification Queue</h2>
          <p className="text-xs text-neutral-500">
            Review raw field survey records, inspect GPS metadata, and approve verified data into MEAL indicators.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 p-1 rounded-lg">
          {['all', 'submitted', 'under_review', 'approved', 'returned'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded text-xs font-semibold capitalize transition ${
                statusFilter === status 
                  ? 'bg-white text-primary shadow-xs' 
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <ClipboardListIcon className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-neutral-700">No Submissions Found</h3>
          <p className="text-xs text-neutral-500 mt-1">
            {statusFilter === 'all' 
              ? 'No field forms have been filled yet. Use the Form Builder to collect field records.'
              : `No submissions currently in "${statusFilter}" status.`}
          </p>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Submission Ref</th>
                  <th className="py-3 px-4">Form Title</th>
                  <th className="py-3 px-4">Enumerator</th>
                  <th className="py-3 px-4">Date Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(sub => {
                  const form = forms.find(f => f.id === sub.formId);
                  const statusColors: Record<string, string> = {
                    submitted: 'bg-blue-100 text-blue-800',
                    under_review: 'bg-amber-100 text-amber-800',
                    approved: 'bg-emerald-100 text-emerald-800',
                    returned: 'bg-rose-100 text-rose-800',
                    draft: 'bg-neutral-100 text-neutral-600'
                  };

                  return (
                    <tr key={sub.id} className="hover:bg-neutral-50 transition">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-neutral-800">
                        {sub.id.substring(0, 12)}
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-800">
                        {form?.title || 'Unknown Form'}
                      </td>
                      <td className="py-3 px-4 text-neutral-600 text-xs">
                        {sub.enumeratorName}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 text-xs">
                        {new Date(sub.submissionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusColors[sub.status] || 'bg-neutral-100 text-neutral-700'}`}>
                          {sub.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => { setSelectedSub(sub); setReviewNote(sub.reviewNotes || ''); }}
                        >
                          Inspect & Verify
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect & Review Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase text-neutral-400">Submission Verification</span>
                <h3 className="text-base font-bold">Ref: {selectedSub.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedSub(null)}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Metadata strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-400 block">Enumerator:</span>
                  <strong className="text-neutral-700">{selectedSub.enumeratorName}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block">Submitted:</span>
                  <strong className="text-neutral-700">{new Date(selectedSub.submissionDate).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block">Current Status:</span>
                  <span className="font-bold capitalize text-primary">{selectedSub.status.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">GPS Coordinates:</span>
                  <strong className="text-neutral-700">
                    {selectedSub.gpsLocation ? `${selectedSub.gpsLocation.latitude.toFixed(3)}, ${selectedSub.gpsLocation.longitude.toFixed(3)}` : 'N/A'}
                  </strong>
                </div>
              </div>

              {/* Submitted Answers */}
              <div>
                <h4 className="text-sm font-bold text-neutral-800 mb-2">Submitted Field Observations</h4>
                <div className="space-y-2 border border-neutral-200 rounded-lg p-3 bg-neutral-50 text-xs">
                  {Object.entries(selectedSub.data).map(([key, value]) => {
                    const form = forms.find(f => f.id === selectedSub.formId);
                    const field = form?.fields.find(f => f.id === key);
                    const label = field?.label || key;

                    return (
                      <div key={key} className="p-2.5 bg-white rounded border border-neutral-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <div>
                          <span className="font-semibold text-neutral-800">{label}</span>
                          {field?.mappedIndicatorId && (
                            <span className="ml-2 px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                              Linked to Indicator
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-neutral-700 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviewer Notes input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  MEAL Reviewer Notes / Justification:
                </label>
                <textarea 
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-xs focus:ring-2 focus:ring-primary"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Record verification check results, ledger corroborations, or reasons for return..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => handleUpdateStatus(selectedSub, 'returned')}
              >
                Return to Enumerator
              </Button>

              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedSub, 'under_review')}
                >
                  Mark Under Review
                </Button>
                {(() => {
                  const check = accessControl.canApproveSubmission(selectedSub);
                  return (
                    <Button 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedSub, 'approved')}
                      disabled={!check.allowed}
                      title={check.reason}
                    >
                      {check.allowed ? 'Approve & Commit to Indicators' : 'Approval Prohibited (Policy Guard)'}
                    </Button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSubmissionsView;
