import { Indicator, DataPoint, IndicatorDataType, IndicatorStatus, StatusThresholds, DataQualityIssue } from '../types';
import { DEFAULT_STATUS_THRESHOLDS } from '../constants';

export interface IndicatorMetrics {
  status: IndicatorStatus;
  achievementPercentage: number | null;
  progressFromBaseline: number | null;
  variance: number | null;
  isLowerBetter: boolean;
  isTargetRange: boolean;
  formattedActual: string;
  formattedTarget: string;
  calculationNote?: string;
  hasZeroDenominator?: boolean;
}

export interface DisaggregationResult {
  categories: Record<string, number>;
  total: number;
}

/**
 * Authoritative MEAL Indicator Calculation Engine
 * Handles:
 * 1. Higher-is-better indicators (target achievement & baseline progression)
 * 2. Lower-is-better indicators (reduction achievement & negative variance)
 * 3. Target-range indicators (bounded acceptable intervals)
 * 4. Numeric counts and percentage ratios
 * 5. Numerator / Denominator evaluation and Zero-Denominator protection
 * 6. Missing values, negative values, and zero targets
 * 7. Baseline-to-target progress tracking
 */
export const calculateIndicatorMetrics = (
  indicator: Indicator, 
  latestDataPoint?: DataPoint
): IndicatorMetrics => {
  const isLowerBetter = indicator.directionality === 'lower_is_better';
  const isTargetRange = indicator.directionality === 'target_range';

  // 1. Text / Qualitative Indicators
  if (indicator.dataType === IndicatorDataType.Text) {
    return {
      status: latestDataPoint?.actualValue ? IndicatorStatus.ON_TRACK : IndicatorStatus.NO_DATA,
      achievementPercentage: null,
      progressFromBaseline: null,
      variance: null,
      isLowerBetter: false,
      isTargetRange: false,
      formattedActual: latestDataPoint?.actualValue ? String(latestDataPoint.actualValue) : 'No data',
      formattedTarget: String(indicator.targetValue || 'Qualitative Goal')
    };
  }

  // 2. Missing data point or empty value
  if (!latestDataPoint || latestDataPoint.actualValue === '' || latestDataPoint.actualValue === undefined || latestDataPoint.actualValue === null) {
    return {
      status: IndicatorStatus.NO_DATA,
      achievementPercentage: null,
      progressFromBaseline: null,
      variance: null,
      isLowerBetter,
      isTargetRange,
      formattedActual: 'No submissions',
      formattedTarget: `${indicator.targetValue ?? 'N/A'} ${indicator.unitOfMeasure || ''}`.trim()
    };
  }

  // 3. Numerator / Denominator Check & Zero Denominator Protection
  let actual: number;
  let calculationNote: string | undefined;
  let hasZeroDenominator = false;

  if (latestDataPoint.numerator !== undefined && latestDataPoint.denominator !== undefined) {
    const num = Number(latestDataPoint.numerator);
    const den = Number(latestDataPoint.denominator);

    if (den === 0) {
      hasZeroDenominator = true;
      return {
        status: IndicatorStatus.NOT_APPLICABLE,
        achievementPercentage: null,
        progressFromBaseline: null,
        variance: null,
        isLowerBetter,
        isTargetRange,
        formattedActual: `${num} / 0 (Undefined)`,
        formattedTarget: `${indicator.targetValue} ${indicator.unitOfMeasure || ''}`.trim(),
        calculationNote: 'Zero denominator: division by zero is mathematically undefined. Requires review.',
        hasZeroDenominator: true
      };
    } else {
      actual = (num / den) * (indicator.dataType === IndicatorDataType.Percentage ? 100 : 1);
      calculationNote = `Calculated from ${num} / ${den}`;
    }
  } else {
    actual = typeof latestDataPoint.actualValue === 'number'
      ? latestDataPoint.actualValue
      : parseFloat(String(latestDataPoint.actualValue));
  }

  const target = typeof indicator.targetValue === 'number'
    ? indicator.targetValue
    : parseFloat(String(indicator.targetValue));

  const baseline = indicator.baselineValue !== undefined && indicator.baselineValue !== '' && indicator.baselineValue !== null
    ? (typeof indicator.baselineValue === 'number' ? indicator.baselineValue : parseFloat(String(indicator.baselineValue)))
    : null;

  // 4. Non-numeric inputs
  if (isNaN(actual) || isNaN(target)) {
    return {
      status: IndicatorStatus.NOT_APPLICABLE,
      achievementPercentage: null,
      progressFromBaseline: null,
      variance: null,
      isLowerBetter,
      isTargetRange,
      formattedActual: String(latestDataPoint.actualValue),
      formattedTarget: String(indicator.targetValue),
      calculationNote: 'Non-numeric actual or target value'
    };
  }

  let achievementPct: number | null = null;
  let progressFromBaseline: number | null = null;
  const variance = actual - target;

  // 5. Target Range Indicators (e.g. blood pressure, room temperature, staff ratio)
  if (isTargetRange) {
    const rangeMin = indicator.targetRangeMin !== undefined ? indicator.targetRangeMin : target * 0.9;
    const rangeMax = indicator.targetRangeMax !== undefined ? indicator.targetRangeMax : target * 1.1;

    if (actual >= rangeMin && actual <= rangeMax) {
      achievementPct = 100;
    } else if (actual < rangeMin) {
      achievementPct = rangeMin > 0 ? (actual / rangeMin) * 100 : 0;
    } else {
      const overshoot = actual - rangeMax;
      achievementPct = Math.max(0, 100 - (overshoot / rangeMax) * 100);
    }

    if (baseline !== null && !isNaN(baseline)) {
      const midTarget = (rangeMin + rangeMax) / 2;
      const initialGap = Math.abs(baseline - midTarget);
      const currentGap = Math.abs(actual - midTarget);
      progressFromBaseline = initialGap > 0 ? Math.max(0, ((initialGap - currentGap) / initialGap) * 100) : 100;
    }
  }
  // 6. Lower is Better (e.g. malnutrition, maternal mortality, dropout rate)
  else if (isLowerBetter) {
    if (target === 0) {
      // Zero tolerance target (e.g. 0 zero deaths)
      achievementPct = actual <= 0 ? 100 : Math.max(0, 100 - (actual * 10));
    } else {
      // Reduction calculation
      achievementPct = ((target - (actual - target)) / target) * 100;
    }

    if (baseline !== null && !isNaN(baseline)) {
      if (baseline === target) {
        progressFromBaseline = actual <= target ? 100 : 0;
      } else {
        progressFromBaseline = ((baseline - actual) / (baseline - target)) * 100;
      }
    }
  } 
  // 7. Higher is Better (Standard case)
  else {
    if (target === 0) {
      achievementPct = actual >= 0 ? 100 : 0;
    } else {
      achievementPct = (actual / target) * 100;
    }

    if (baseline !== null && !isNaN(baseline)) {
      if (target === baseline) {
        progressFromBaseline = actual >= target ? 100 : 0;
      } else {
        progressFromBaseline = ((actual - baseline) / (target - baseline)) * 100;
      }
    }
  }

  // 8. Determine Status based on Thresholds
  const thresholds = indicator.statusThresholds || DEFAULT_STATUS_THRESHOLDS;
  let status: IndicatorStatus;

  if (achievementPct === null || isNaN(achievementPct)) {
    status = IndicatorStatus.NOT_APPLICABLE;
  } else if (achievementPct < thresholds.offTrackLessThan) {
    status = IndicatorStatus.OFF_TRACK;
  } else if (achievementPct < thresholds.atRiskLessThan) {
    status = IndicatorStatus.AT_RISK;
  } else {
    status = IndicatorStatus.ON_TRACK;
  }

  return {
    status,
    achievementPercentage: achievementPct !== null ? Math.round(achievementPct * 10) / 10 : null,
    progressFromBaseline: progressFromBaseline !== null ? Math.round(progressFromBaseline * 10) / 10 : null,
    variance: Math.round(variance * 10) / 10,
    isLowerBetter,
    isTargetRange,
    formattedActual: `${Math.round(actual * 100) / 100} ${indicator.unitOfMeasure || ''}`.trim(),
    formattedTarget: `${target} ${indicator.unitOfMeasure || ''}`.trim(),
    calculationNote,
    hasZeroDenominator
  };
};

/**
 * Aggregates disaggregated values across a set of approved data points
 */
export const calculateDisaggregatedTotals = (dataPoints: DataPoint[]): DisaggregationResult => {
  const categories: Record<string, number> = {};
  let total = 0;

  for (const dp of dataPoints) {
    if (dp.disaggregatedValues) {
      for (const [key, val] of Object.entries(dp.disaggregatedValues)) {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          categories[key] = (categories[key] || 0) + numVal;
          total += numVal;
        }
      }
    } else {
      const numVal = Number(dp.actualValue);
      if (!isNaN(numVal)) {
        categories['General'] = (categories['General'] || 0) + numVal;
        total += numVal;
      }
    }
  }

  return { categories, total };
};

/**
 * Calculates weighted portfolio performance across indicators
 */
export const calculatePortfolioIndex = (
  indicators: Indicator[],
  dataPoints: DataPoint[]
): { averageAchievement: number; onTrackPct: number; totalCount: number } => {
  if (indicators.length === 0) {
    return { averageAchievement: 0, onTrackPct: 0, totalCount: 0 };
  }

  let totalAchievement = 0;
  let validCount = 0;
  let onTrackCount = 0;

  for (const ind of indicators) {
    const dps = dataPoints.filter(d => d.indicatorId === ind.id);
    const latest = dps.length > 0 ? dps[dps.length - 1] : undefined;
    const metrics = calculateIndicatorMetrics(ind, latest);

    if (metrics.achievementPercentage !== null) {
      totalAchievement += metrics.achievementPercentage;
      validCount++;
    }

    if (metrics.status === IndicatorStatus.ON_TRACK) {
      onTrackCount++;
    }
  }

  return {
    averageAchievement: validCount > 0 ? Math.round((totalAchievement / validCount) * 10) / 10 : 0,
    onTrackPct: Math.round((onTrackCount / indicators.length) * 100),
    totalCount: indicators.length
  };
};

/**
 * Backward compatible status function
 */
export const getIndicatorStatus = (indicator: Indicator, latestDataPoint?: DataPoint): IndicatorStatus => {
  return calculateIndicatorMetrics(indicator, latestDataPoint).status;
};

/**
 * Pure statistical data quality detection engine
 * Performs:
 * 1. Z-Score outlier detection (|Z| >= 2.2 SD)
 * 2. Duplicate submission detection (same indicator, exact same collection date)
 * 3. Range boundaries (Percentage < 0% or > 100%, negative values where forbidden)
 */
export const detectDataQualityIssues = (
  indicators: Indicator[],
  dataPoints: DataPoint[]
): DataQualityIssue[] => {
  const issues: DataQualityIssue[] = [];
  const indMap = new Map<string, Indicator>(indicators.map(i => [i.id, i]));

  // Group by indicator
  const byIndicator: Record<string, DataPoint[]> = {};
  for (const dp of dataPoints) {
    if (!byIndicator[dp.indicatorId]) byIndicator[dp.indicatorId] = [];
    byIndicator[dp.indicatorId].push(dp);
  }

  for (const [indId, points] of Object.entries(byIndicator)) {
    const indicator = indMap.get(indId);
    const numValues = points
      .map(p => typeof p.actualValue === 'number' ? p.actualValue : parseFloat(String(p.actualValue)))
      .filter(v => !isNaN(v));

    // 1. Statistical Outlier Check (|Z| >= 2.2, sample size >= 3)
    if (numValues.length >= 3) {
      const mean = numValues.reduce((a, b) => a + b, 0) / numValues.length;
      const variance = numValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numValues.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 0) {
        for (const p of points) {
          const v = typeof p.actualValue === 'number' ? p.actualValue : parseFloat(String(p.actualValue));
          if (!isNaN(v)) {
            const zScore = Math.abs((v - mean) / stdDev);
            if (zScore >= 2.2) {
              issues.push({
                id: `dqa_outlier_${p.id}`,
                recordId: p.id,
                indicatorId: indId,
                field: 'actualValue',
                value: v,
                severity: 'warning',
                checkType: 'outlier',
                message: `Statistical outlier detected: value ${v} deviates with Z-score of ${zScore.toFixed(2)} (mean: ${mean.toFixed(1)}, SD: ${stdDev.toFixed(1)})`,
                status: 'flagged',
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }
    }

    // 2. Duplicate Check (same indicator on same date)
    const dateMap: Record<string, DataPoint[]> = {};
    for (const p of points) {
      if (!dateMap[p.collectionDate]) dateMap[p.collectionDate] = [];
      dateMap[p.collectionDate].push(p);
    }

    for (const [dateStr, datePoints] of Object.entries(dateMap)) {
      if (datePoints.length > 1) {
        for (const p of datePoints.slice(1)) {
          issues.push({
            id: `dqa_dup_${p.id}`,
            recordId: p.id,
            indicatorId: indId,
            field: 'collectionDate',
            value: dateStr,
            severity: 'error',
            checkType: 'duplicate',
            message: `Duplicate submission detected on ${dateStr} for indicator "${indicator?.name || indId}"`,
            status: 'flagged',
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // 3. Boundary & Range Violations
    for (const p of points) {
      const v = typeof p.actualValue === 'number' ? p.actualValue : parseFloat(String(p.actualValue));
      if (!isNaN(v)) {
        if (indicator?.dataType === IndicatorDataType.Percentage && (v < 0 || v > 100)) {
          issues.push({
            id: `dqa_range_${p.id}`,
            recordId: p.id,
            indicatorId: indId,
            field: 'actualValue',
            value: v,
            severity: 'error',
            checkType: 'range',
            message: `Percentage value ${v}% falls outside the allowable 0% - 100% boundary`,
            status: 'flagged',
            timestamp: new Date().toISOString()
          });
        } else if ((indicator?.dataType === IndicatorDataType.Numeric || !indicator?.dataType) && v < 0) {
          issues.push({
            id: `dqa_range_neg_${p.id}`,
            recordId: p.id,
            indicatorId: indId,
            field: 'actualValue',
            value: v,
            severity: 'error',
            checkType: 'range',
            message: `Negative count ${v} is invalid for non-negative indicator "${indicator?.name || indId}"`,
            status: 'flagged',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  return issues;
};
