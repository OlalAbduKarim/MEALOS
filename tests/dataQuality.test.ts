import { describe, it, expect } from 'vitest';
import { detectDataQualityIssues } from '../utils/mneUtils';
import { Indicator, DataPoint, IndicatorDataType } from '../types';

describe('Data Quality Assurance & Statistical Checks', () => {
  const baseIndicator: Indicator = {
    id: 'ind-dqa-1',
    projectId: 'proj-1',
    name: 'Children Screened for Malnutrition',
    description: 'Number of children screened during outreach',
    unitOfMeasure: 'Children',
    targetValue: 1000,
    dataType: IndicatorDataType.Numeric,
    directionality: 'higher_is_better',
  };

  it('detects extreme statistical outliers with |Z| >= 2.2', () => {
    // Normal distribution values around 100 with small variance, plus one extreme outlier (500)
    const points: DataPoint[] = [
      { id: 'dp-1', indicatorId: 'ind-dqa-1', actualValue: 98, collectionDate: '2026-01-01' },
      { id: 'dp-2', indicatorId: 'ind-dqa-1', actualValue: 102, collectionDate: '2026-01-02' },
      { id: 'dp-3', indicatorId: 'ind-dqa-1', actualValue: 100, collectionDate: '2026-01-03' },
      { id: 'dp-4', indicatorId: 'ind-dqa-1', actualValue: 101, collectionDate: '2026-01-04' },
      { id: 'dp-5', indicatorId: 'ind-dqa-1', actualValue: 99, collectionDate: '2026-01-05' },
      { id: 'dp-6', indicatorId: 'ind-dqa-1', actualValue: 500, collectionDate: '2026-01-06' }, // Extreme outlier
    ];

    const issues = detectDataQualityIssues([baseIndicator], points);
    const outlierIssues = issues.filter(i => i.checkType === 'outlier');

    expect(outlierIssues.length).toBe(1);
    expect(outlierIssues[0].recordId).toBe('dp-6');
    expect(outlierIssues[0].severity).toBe('warning');
    expect(outlierIssues[0].message).toContain('Statistical outlier detected');
  });

  it('detects duplicate entries submitted on identical dates', () => {
    const points: DataPoint[] = [
      { id: 'dp-1', indicatorId: 'ind-dqa-1', actualValue: 150, collectionDate: '2026-02-15' },
      { id: 'dp-2', indicatorId: 'ind-dqa-1', actualValue: 155, collectionDate: '2026-02-15' }, // Duplicate date
    ];

    const issues = detectDataQualityIssues([baseIndicator], points);
    const dupIssues = issues.filter(i => i.checkType === 'duplicate');

    expect(dupIssues.length).toBe(1);
    expect(dupIssues[0].recordId).toBe('dp-2');
    expect(dupIssues[0].severity).toBe('error');
    expect(dupIssues[0].value).toBe('2026-02-15');
  });

  it('flags percentages outside the 0% - 100% boundary', () => {
    const pctIndicator: Indicator = {
      id: 'ind-pct',
      projectId: 'proj-1',
      name: 'Immunization Coverage Rate',
      description: 'Percentage of children fully immunized',
      unitOfMeasure: '%',
      targetValue: 95,
      dataType: IndicatorDataType.Percentage,
    };

    const points: DataPoint[] = [
      { id: 'dp-1', indicatorId: 'ind-pct', actualValue: 88, collectionDate: '2026-03-01' },
      { id: 'dp-2', indicatorId: 'ind-pct', actualValue: 125, collectionDate: '2026-03-02' }, // Invalid > 100%
      { id: 'dp-3', indicatorId: 'ind-pct', actualValue: -5, collectionDate: '2026-03-03' },  // Invalid < 0%
    ];

    const issues = detectDataQualityIssues([pctIndicator], points);
    const rangeIssues = issues.filter(i => i.checkType === 'range');

    expect(rangeIssues.length).toBe(2);
    expect(rangeIssues.map(i => i.recordId)).toEqual(['dp-2', 'dp-3']);
  });

  it('flags negative values on non-negative count indicators', () => {
    const points: DataPoint[] = [
      { id: 'dp-neg', indicatorId: 'ind-dqa-1', actualValue: -15, collectionDate: '2026-04-01' },
    ];

    const issues = detectDataQualityIssues([baseIndicator], points);
    const rangeIssues = issues.filter(i => i.checkType === 'range');

    expect(rangeIssues.length).toBe(1);
    expect(rangeIssues[0].message).toContain('Negative count');
  });

  it('returns clean report with 0 issues on well-formed data', () => {
    const points: DataPoint[] = [
      { id: 'dp-1', indicatorId: 'ind-dqa-1', actualValue: 100, collectionDate: '2026-05-01' },
      { id: 'dp-2', indicatorId: 'ind-dqa-1', actualValue: 105, collectionDate: '2026-05-02' },
      { id: 'dp-3', indicatorId: 'ind-dqa-1', actualValue: 98, collectionDate: '2026-05-03' },
    ];

    const issues = detectDataQualityIssues([baseIndicator], points);
    expect(issues.length).toBe(0);
  });
});
