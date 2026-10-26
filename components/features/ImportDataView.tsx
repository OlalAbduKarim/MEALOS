import React, { useState } from 'react';
import { Project, Indicator, DataPoint } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ArrowUpTrayIcon, DocumentDuplicateIcon, CheckIcon, ShieldCheckIcon } from '../../constants';
import { mealStorage } from '../../services/mealStorage';

interface ImportDataViewProps {
  activeProject: Project | null;
  projectIndicators?: Indicator[];
  onImportComplete?: () => void;
  onAddDataPoint?: (dataPoint: Omit<DataPoint, 'id'>) => Promise<void> | void;
}

export const ImportDataView: React.FC<ImportDataViewProps> = ({ 
  activeProject,
  projectIndicators = [],
  onImportComplete,
  onAddDataPoint
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'complete'>('upload');
  const [csvText, setCsvText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  
  // Mapping configuration
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');
  const [valueColumn, setValueColumn] = useState<string>('');
  const [dateColumn, setDateColumn] = useState<string>('');
  const [notesColumn, setNotesColumn] = useState<string>('');

  const [importResults, setImportResults] = useState<{ imported: number; errors: number; details: string[] } | null>(null);

  const sampleCsvData = `Date,Value,District,Notes
2024-01-15,120,Central District,Routine clinic monthly total
2024-02-15,135,Central District,Post-campaign increase observed
2024-03-15,142,Central District,Verified by health in-charge
2024-01-20,85,North Highlands,Cold chain maintenance ongoing
2024-02-20,92,North Highlands,Staff training completed`;

  const handleLoadSample = () => {
    setCsvText(sampleCsvData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = () => {
    if (!csvText.trim()) {
      alert('Please provide CSV data by file or text.');
      return;
    }

    const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert('CSV must contain a header row and at least one data row.');
      return;
    }

    // Split headers respecting quotes
    const rawHeaders = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
    setHeaders(rawHeaders);

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
      const rowObj: Record<string, string> = {};
      rawHeaders.forEach((h, idx) => {
        rowObj[h] = cols[idx] || '';
      });
      rows.push(rowObj);
    }

    setParsedRows(rows);

    // Auto-detect default columns
    const valueMatch = rawHeaders.find(h => /value|actual|count|total|number/i.test(h)) || rawHeaders[1] || '';
    const dateMatch = rawHeaders.find(h => /date|period|month|day/i.test(h)) || rawHeaders[0] || '';
    const notesMatch = rawHeaders.find(h => /notes|remarks|comment|description/i.test(h)) || '';

    setValueColumn(valueMatch);
    setDateColumn(dateMatch);
    setNotesColumn(notesMatch);
    if (projectIndicators.length > 0) {
      setSelectedIndicatorId(projectIndicators[0].id);
    }

    setStep('mapping');
  };

  const handleExecuteImport = async () => {
    if (!selectedIndicatorId) {
      alert('Please select a target indicator for the imported values.');
      return;
    }
    if (!valueColumn) {
      alert('Please specify which column represents the Actual Value.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errorDetails: string[] = [];

    const targetIndicator = projectIndicators.find(i => i.id === selectedIndicatorId);

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const rawVal = row[valueColumn];
      const numVal = parseFloat(rawVal);

      if (rawVal === undefined || rawVal === '' || isNaN(numVal)) {
        errorCount++;
        errorDetails.push(`Row ${i + 1}: Non-numeric value "${rawVal}"`);
        continue;
      }

      const dateVal = row[dateColumn] || new Date().toISOString().split('T')[0];
      const notesVal = notesColumn ? row[notesColumn] : 'Imported via CSV Wizard';

      if (onAddDataPoint) {
        await onAddDataPoint({
          indicatorId: selectedIndicatorId,
          actualValue: numVal,
          collectionDate: dateVal,
          notes: notesVal,
          verificationStatus: 'verified',
          verifiedBy: 'CSV Import Wizard',
          tags: { source: 'batch_csv_import' }
        });
      }

      successCount++;
    }

    mealStorage.logAudit(
      mealStorage.getActiveOrganisationId(),
      activeProject?.id,
      'Batch CSV Import',
      'Indicator',
      selectedIndicatorId,
      `Imported ${successCount} data points into "${targetIndicator?.name || selectedIndicatorId}" (${errorCount} errors)`
    );

    setImportResults({
      imported: successCount,
      errors: errorCount,
      details: errorDetails
    });
    setStep('complete');
  };

  if (!activeProject) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <ArrowUpTrayIcon className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-neutral-700">No Active Project Selected</h3>
        <p className="text-xs text-neutral-500 mt-1">Select an active project to import external data points into its indicators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wizard Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-800">Data Import Wizard</h2>
          <p className="text-xs text-neutral-500">
            Import bulk historical observations, survey totals, or partner spreadsheets into MEAL indicators.
          </p>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded font-semibold ${step === 'upload' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            1. Upload
          </span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded font-semibold ${step === 'mapping' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            2. Map Columns
          </span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded font-semibold ${step === 'complete' ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            3. Verification
          </span>
        </div>
      </div>

      {/* Step 1: Upload / Paste */}
      {step === 'upload' && (
        <Card className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-800">Select or Paste CSV Dataset</h3>
              <p className="text-xs text-neutral-500">Upload a .csv file from your computer or paste delimited text directly.</p>
            </div>
            <Button size="sm" variant="secondary" onClick={handleLoadSample} leftIcon={<DocumentDuplicateIcon className="w-3.5 h-3.5" />}>
              Load Sample Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary transition flex flex-col justify-center items-center">
              <ArrowUpTrayIcon className="w-10 h-10 text-neutral-400 mb-2" />
              <label className="cursor-pointer">
                <span className="text-sm font-semibold text-primary hover:underline">Choose CSV File</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
              <p className="text-xs text-neutral-400 mt-1">Supports standard UTF-8 comma-separated files</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Or Paste Raw CSV Text:</label>
              <textarea 
                rows={6}
                className="w-full px-3 py-2 border border-neutral-300 rounded font-mono text-xs focus:ring-2 focus:ring-primary focus:outline-hidden"
                placeholder="Date,Value,District,Notes..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-neutral-100">
            <Button onClick={parseCsv} disabled={!csvText.trim()}>
              Proceed to Column Mapping
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Mapping & Preview */}
      {step === 'mapping' && (
        <Card className="space-y-5">
          <div className="pb-3 border-b border-neutral-100">
            <h3 className="text-base font-bold text-neutral-800">Map Columns to Target Indicator</h3>
            <p className="text-xs text-neutral-500">
              Found {parsedRows.length} data rows with columns: {headers.join(', ')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Target Indicator *</label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs bg-white font-medium"
                value={selectedIndicatorId}
                onChange={(e) => setSelectedIndicatorId(e.target.value)}
              >
                {projectIndicators.map(ind => (
                  <option key={ind.id} value={ind.id}>
                    {ind.name} ({ind.unitOfMeasure})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Actual Value Column *</label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs bg-white"
                value={valueColumn}
                onChange={(e) => setValueColumn(e.target.value)}
              >
                <option value="">-- Choose Column --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Collection Date Column</label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs bg-white"
                value={dateColumn}
                onChange={(e) => setDateColumn(e.target.value)}
              >
                <option value="">-- Auto-Assign Today --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Notes / Annotation Column</label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs bg-white"
                value={notesColumn}
                onChange={(e) => setNotesColumn(e.target.value)}
              >
                <option value="">-- Optional --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sample Preview Table */}
          <div>
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">First 5 Rows Preview</h4>
            <div className="overflow-x-auto border border-neutral-200 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-100 text-neutral-600 font-semibold border-b">
                  <tr>
                    {headers.map(h => (
                      <th key={h} className="p-2 border-r last:border-r-0">
                        {h} {h === valueColumn && <span className="text-primary font-bold">(Value)</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      {headers.map(h => (
                        <td key={h} className="p-2 border-r last:border-r-0 font-mono text-neutral-700">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <Button variant="secondary" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button onClick={handleExecuteImport}>
              Validate & Import {parsedRows.length} Rows
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Complete / Summary */}
      {step === 'complete' && importResults && (
        <Card className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h3 className="text-xl font-bold text-neutral-800">Import Completed Successfully</h3>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            Successfully imported <strong className="text-emerald-700">{importResults.imported} data points</strong> into the indicator tracking table.
          </p>

          {importResults.errors > 0 && (
            <div className="max-w-md mx-auto p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 text-left">
              <strong>{importResults.errors} row(s) skipped due to errors:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {importResults.details.slice(0, 3).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-3">
            <Button onClick={() => { setStep('upload'); setCsvText(''); onImportComplete?.(); }}>
              Import Another Dataset
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImportDataView;
