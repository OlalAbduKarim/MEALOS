import React, { useState } from 'react';
import { Project, Evaluation } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, BookOpenIcon, CheckIcon } from '../../constants';
import { mealStorage } from '../../services/mealStorage';

interface EvaluationManagementViewProps {
  activeProject: Project | null;
}

const OECD_DAC_CRITERIA = [
  'Relevance',
  'Coherence',
  'Effectiveness',
  'Efficiency',
  'Impact',
  'Sustainability'
];

export const EvaluationManagementView: React.FC<EvaluationManagementViewProps> = ({ activeProject }) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>(() => {
    return mealStorage.getEvaluations(activeProject?.id);
  });

  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(evaluations[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<Evaluation['type']>('midterm');
  const [newLead, setNewLead] = useState('');
  const [newFindings, setNewFindings] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>(['Relevance', 'Effectiveness']);

  const reload = () => {
    setEvaluations(mealStorage.getEvaluations(activeProject?.id));
  };

  const handleSaveEvaluation = () => {
    if (!activeProject || !newTitle.trim()) {
      alert('Evaluation title is required.');
      return;
    }

    const created: Evaluation = {
      id: `eval_${Date.now()}`,
      projectId: activeProject.id,
      title: newTitle,
      type: newType,
      status: 'planned',
      leadEvaluator: newLead || 'To be commissioned',
      criteria: selectedCriteria,
      keyFindings: newFindings || 'Evaluation in inception phase; data collection instruments being developed.',
      recommendations: [
        'Establish independent beneficiary verification mechanism prior to endline.',
        'Track disaggregated indicators by vulnerable sub-groups.'
      ],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    };

    mealStorage.saveEvaluation(created);
    reload();
    setSelectedEval(created);
    setIsCreating(false);
    setNewTitle('');
    setNewLead('');
    setNewFindings('');
  };

  if (!activeProject) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <p className="text-neutral-600">Please select an active project to access Evaluation Management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-md">
              <BookOpenIcon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-800">Evaluation Management (OECD-DAC Framework)</h2>
              <p className="text-xs text-neutral-500">
                Independent baseline, mid-term, endline, and impact evaluations, findings synthesis, and management responses.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => setIsCreating(true)} leftIcon={<PlusIcon />}>
          Register New Evaluation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evaluations List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Project Evaluation Studies ({evaluations.length})
          </h3>

          {evaluations.map(ev => {
            const isSelected = selectedEval?.id === ev.id;
            return (
              <div 
                key={ev.id}
                onClick={() => setSelectedEval(ev)}
                className={`p-4 rounded-lg border cursor-pointer transition ${
                  isSelected ? 'bg-indigo-50 border-indigo-300 shadow-xs' : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                    {ev.type}
                  </span>
                  <span className="text-xs capitalize font-semibold text-neutral-500">
                    {ev.status}
                  </span>
                </div>

                <h4 className="font-bold text-neutral-800 text-sm mb-1">{ev.title}</h4>
                <p className="text-xs text-neutral-500">{ev.leadEvaluator}</p>
                <div className="text-[11px] text-neutral-400 font-mono mt-2">
                  {ev.startDate} → {ev.endDate}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Evaluation Detail Dossier */}
        <div className="lg:col-span-2 space-y-4">
          {selectedEval ? (
            <Card className="space-y-5 border border-neutral-200">
              <div className="border-b border-neutral-100 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-bold uppercase">
                    {selectedEval.type} Evaluation
                  </span>
                  <span className="text-xs font-mono text-neutral-400">ID: {selectedEval.id}</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-800">{selectedEval.title}</h3>
                <p className="text-xs text-neutral-500 mt-1">Lead: <strong className="text-neutral-700">{selectedEval.leadEvaluator}</strong></p>
              </div>

              {/* OECD DAC Criteria tags */}
              <div>
                <span className="text-xs font-bold text-neutral-600 block mb-1.5">Evaluated OECD-DAC Criteria:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEval.criteria.map(crit => (
                    <span key={crit} className="px-2.5 py-1 bg-neutral-100 text-neutral-700 font-semibold rounded text-xs border border-neutral-200">
                      ✓ {crit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Findings */}
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Key Evaluative Findings & Evidence Synthesis
                </h4>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  {selectedEval.keyFindings}
                </p>
              </div>

              {/* Management Response & Recommendations Tracker */}
              <div>
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Actionable Recommendations & Management Responses
                </h4>
                <div className="space-y-2">
                  {selectedEval.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-neutral-200 flex items-start gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-neutral-800 font-medium">{rec}</p>
                        <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">
                          Status: In Action Plan · Verified by Project Manager
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <p className="text-neutral-500 text-sm">Select an evaluation from the list to view its complete report dossier.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Evaluation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-800">Commission / Register New Evaluation</h3>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Study Title *</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Endline Impact Assessment of Maternal Care Voucher System"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Evaluation Type</label>
                <select 
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                >
                  <option value="baseline">Baseline Survey</option>
                  <option value="midterm">Mid-Term Evaluation</option>
                  <option value="endline">Endline Evaluation</option>
                  <option value="impact">Impact Assessment</option>
                  <option value="thematic">Thematic Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Lead Evaluator / Institution</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
                  value={newLead}
                  onChange={(e) => setNewLead(e.target.value)}
                  placeholder="e.g., Independent M&E Firm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">OECD-DAC Criteria to Evaluate</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {OECD_DAC_CRITERIA.map(crit => (
                  <label key={crit} className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={selectedCriteria.includes(crit)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCriteria(prev => [...prev, crit]);
                        else setSelectedCriteria(prev => prev.filter(c => c !== crit));
                      }}
                      className="text-primary rounded"
                    />
                    {crit}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Summary Findings / Terms of Reference</label>
              <textarea 
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary"
                value={newFindings}
                onChange={(e) => setNewFindings(e.target.value)}
                placeholder="Scope of work, methodology (mixed-methods, quasi-experimental), or initial key findings..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="secondary" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveEvaluation}>Save Evaluation</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationManagementView;
