import { describe, it, expect } from 'vitest';
import { 
  calculateIndicatorMetrics, 
  calculateDisaggregatedTotals, 
  calculatePortfolioIndex 
} from '../utils/mneUtils';
import { Indicator, DataPoint, IndicatorDataType, IndicatorStatus } from '../types';

describe('Authoritative MEAL Indicator Calculation Engine Tests', () => {

  // 1. Higher-is-better indicators
  it('correctly calculates higher-is-better indicators', () => {
    const indicator: Indicator = {
      id: 'ind_01',
      projectId: 'proj_01',
      name: 'Children Vaccinated',
      description: 'Routine immunization',
      unitOfMeasure: 'Children',
      dataType: IndicatorDataType.Numeric,
      targetValue: 100,
      baselineValue: 20,
      directionality: 'higher_is_better'
    };
    const dp: DataPoint = {
      id: 'dp_01',
      indicatorId: 'ind_01',
      actualValue: 80,
      collectionDate: '2024-03-01'
    };

    const metrics = calculateIndicatorMetrics(indicator, dp);
    expect(metrics.achievementPercentage).toBe(80);
    // Baseline progress: (80 - 20) / (100 - 20) * 100 = 60 / 80 * 100 = 75%
    expect(metrics.progressFromBaseline).toBe(75);
    expect(metrics.variance).toBe(-20);
    expect(metrics.status).toBe(IndicatorStatus.AT_RISK);
  });

  // 2. Lower-is-better indicators
  it('correctly calculates lower-is-better indicators without penalizing reductions', () => {
    const indicator: Indicator = {
      id: 'ind_02',
      projectId: 'proj_01',
      name: 'Under-5 Malnutrition Rate',
      description: 'Acute malnutrition',
      unitOfMeasure: '%',
      dataType: IndicatorDataType.Percentage,
      targetValue: 10,
      baselineValue: 25,
      directionality: 'lower_is_better'
    };
    const dp: DataPoint = {
      id: 'dp_02',
      indicatorId: 'ind_02',
      actualValue: 9, // Better than target (target is 10)
      collectionDate: '2024-03-01'
    };

    const metrics = calculateIndicatorMetrics(indicator, dp);
    // Target 10, actual 9 -> overshoot: ((10 - (9 - 10)) / 10) * 100 = (11 / 10) * 100 = 110%
    expect(metrics.achievementPercentage).toBe(110);
    // Baseline reduction progress: (25 - 9) / (25 - 10) * 100 = 16 / 15 * 100 = 106.7%
    expect(metrics.progressFromBaseline).toBe(106.7);
    expect(metrics.status).toBe(IndicatorStatus.ON_TRACK);
  });

  // 3. Target-range indicators
  it('evaluates target-range indicators inside and outside tolerance bounds', () => {
    const indicator: Indicator = {
      id: 'ind_03',
      projectId: 'proj_01',
      name: 'Cold Chain Vaccine Storage Temperature',
      description: 'Acceptable storage between 2C and 8C',
      unitOfMeasure: '°C',
      dataType: IndicatorDataType.Numeric,
      targetValue: 5,
      targetRangeMin: 2,
      targetRangeMax: 8,
      baselineValue: 4,
      directionality: 'target_range'
    };

    // Within range
    const dpIn: DataPoint = { id: 'dp_in', indicatorId: 'ind_03', actualValue: 4.5, collectionDate: '2024-03-01' };
    const metricsIn = calculateIndicatorMetrics(indicator, dpIn);
    expect(metricsIn.achievementPercentage).toBe(100);
    expect(metricsIn.status).toBe(IndicatorStatus.ON_TRACK);

    // Below range
    const dpLow: DataPoint = { id: 'dp_low', indicatorId: 'ind_03', actualValue: 1.0, collectionDate: '2024-03-01' };
    const metricsLow = calculateIndicatorMetrics(indicator, dpLow);
    expect(metricsLow.achievementPercentage).toBe(50); // 1.0 / 2.0 * 100
    expect(metricsLow.status).toBe(IndicatorStatus.OFF_TRACK);

    // Above range
    const dpHigh: DataPoint = { id: 'dp_high', indicatorId: 'ind_03', actualValue: 10.0, collectionDate: '2024-03-01' };
    const metricsHigh = calculateIndicatorMetrics(indicator, dpHigh);
    expect(metricsHigh.achievementPercentage).toBe(75); // 100 - (2.0 / 8.0) * 100 = 75%
    expect(metricsHigh.status).toBe(IndicatorStatus.AT_RISK);
  });

  // 4. Numeric counts and cumulative targets
  it('handles numeric counts correctly with integer targets', () => {
    const indicator: Indicator = {
      id: 'ind_04',
      projectId: 'proj_01',
      name: 'Midwives Trained',
      description: 'Count of EmONC certifications',
      unitOfMeasure: 'Persons',
      dataType: IndicatorDataType.Numeric,
      targetValue: 150,
      baselineValue: 0,
      directionality: 'higher_is_better'
    };
    const dp: DataPoint = { id: 'dp_04', indicatorId: 'ind_04', actualValue: 154, collectionDate: '2024-03-01' };
    const metrics = calculateIndicatorMetrics(indicator, dp);
    expect(metrics.achievementPercentage).toBe(102.7);
    expect(metrics.variance).toBe(4);
    expect(metrics.status).toBe(IndicatorStatus.ON_TRACK);
  });

  // 5. Percentages and ratios with Numerator / Denominator
  it('computes percentage from numerator and denominator', () => {
    const indicator: Indicator = {
      id: 'ind_05',
      projectId: 'proj_01',
      name: 'Skilled Delivery Proportion',
      description: 'Numerator: skilled births, Denominator: total births',
      unitOfMeasure: '%',
      dataType: IndicatorDataType.Percentage,
      targetValue: 80,
      baselineValue: 50,
      directionality: 'higher_is_better'
    };
    const dp: DataPoint = {
      id: 'dp_05',
      indicatorId: 'ind_05',
      actualValue: 0,
      numerator: 88,
      denominator: 100,
      collectionDate: '2024-03-01'
    };
    const metrics = calculateIndicatorMetrics(indicator, dp);
    expect(metrics.achievementPercentage).toBe(110); // actual = 88%, target = 80% -> 88/80 = 110%
    expect(metrics.formattedActual).toBe('88 %');
    expect(metrics.status).toBe(IndicatorStatus.ON_TRACK);
  });

  // 6. Zero Denominator Protection
  it('safely handles zero denominators without crashing or returning NaN/Infinity', () => {
    const indicator: Indicator = {
      id: 'ind_06',
      projectId: 'proj_01',
      name: 'Facility Case Fatality Rate',
      description: 'Numerator: deaths, Denominator: total admissions',
      unitOfMeasure: '%',
      dataType: IndicatorDataType.Percentage,
      targetValue: 2,
      directionality: 'lower_is_better'
    };
    const dp: DataPoint = {
      id: 'dp_06',
      indicatorId: 'ind_06',
      actualValue: 0,
      numerator: 0,
      denominator: 0, // Zero admissions
      collectionDate: '2024-03-01'
    };
    const metrics = calculateIndicatorMetrics(indicator, dp);
    expect(metrics.hasZeroDenominator).toBe(true);
    expect(metrics.achievementPercentage).toBeNull();
    expect(metrics.status).toBe(IndicatorStatus.NOT_APPLICABLE);
    expect(metrics.calculationNote).toContain('Zero denominator');
  });

  // 7. Missing values
  it('returns NO_DATA status for missing or unsubmitted data points', () => {
    const indicator: Indicator = {
      id: 'ind_07',
      projectId: 'proj_01',
      name: 'Household Water Access',
      description: 'Households with treated water',
      unitOfMeasure: '%',
      dataType: IndicatorDataType.Percentage,
      targetValue: 90
    };
    const metrics = calculateIndicatorMetrics(indicator, undefined);
    expect(metrics.status).toBe(IndicatorStatus.NO_DATA);
    expect(metrics.achievementPercentage).toBeNull();
    expect(metrics.formattedActual).toBe('No submissions');
  });

  // 8. Negative values and variance calculations
  it('handles negative variance and negative indicators correctly', () => {
    const indicator: Indicator = {
      id: 'ind_08',
      projectId: 'proj_01',
      name: 'Net Growth Rate',
      description: 'Annual growth rate',
      unitOfMeasure: '%',
      dataType: IndicatorDataType.Numeric,
      targetValue: 5,
      baselineValue: -2,
      directionality: 'higher_is_better'
    };
    const dp: DataPoint = { id: 'dp_08', indicatorId: 'ind_08', actualValue: -1, collectionDate: '2024-03-01' };
    const metrics = calculateIndicatorMetrics(indicator, dp);
    expect(metrics.variance).toBe(-6); // -1 - 5 = -6
    // Progress from baseline: (-1 - (-2)) / (5 - (-2)) = 1 / 7 = 14.3%
    expect(metrics.progressFromBaseline).toBe(14.3);
  });

  // 9. Zero targets (zero tolerance / target zero)
  it('correctly handles zero target indicators', () => {
    const indicatorZero: Indicator = {
      id: 'ind_09',
      projectId: 'proj_01',
      name: 'Preventable Maternal Deaths',
      description: 'Target is zero deaths',
      unitOfMeasure: 'Deaths',
      dataType: IndicatorDataType.Numeric,
      targetValue: 0,
      directionality: 'lower_is_better'
    };

    // Actual 0 meets zero tolerance target
    const dpZero: DataPoint = { id: 'dp_z', indicatorId: 'ind_09', actualValue: 0, collectionDate: '2024-03-01' };
    const metricsZero = calculateIndicatorMetrics(indicatorZero, dpZero);
    expect(metricsZero.achievementPercentage).toBe(100);
    expect(metricsZero.status).toBe(IndicatorStatus.ON_TRACK);

    // Actual 3 fails zero tolerance target
    const dpFail: DataPoint = { id: 'dp_f', indicatorId: 'ind_09', actualValue: 3, collectionDate: '2024-03-01' };
    const metricsFail = calculateIndicatorMetrics(indicatorZero, dpFail);
    expect(metricsFail.achievementPercentage).toBe(70); // 100 - (3 * 10) = 70%
    expect(metricsFail.status).toBe(IndicatorStatus.AT_RISK);
  });

  // 10. Disaggregated calculations
  it('correctly aggregates disaggregated categories across submissions', () => {
    const dataPoints: DataPoint[] = [
      {
        id: 'dp_dis1',
        indicatorId: 'ind_10',
        actualValue: 50,
        collectionDate: '2024-03-01',
        disaggregatedValues: { female: 30, male: 20 }
      },
      {
        id: 'dp_dis2',
        indicatorId: 'ind_10',
        actualValue: 70,
        collectionDate: '2024-03-02',
        disaggregatedValues: { female: 45, male: 25 }
      }
    ];

    const totals = calculateDisaggregatedTotals(dataPoints);
    expect(totals.categories['female']).toBe(75);
    expect(totals.categories['male']).toBe(45);
    expect(totals.total).toBe(120);
  });

  // 11. Portfolio Weighted Performance
  it('calculates portfolio-wide index and on-track percentage', () => {
    const indicators: Indicator[] = [
      { id: 'i1', projectId: 'p1', name: 'Ind 1', description: '', unitOfMeasure: '', dataType: IndicatorDataType.Numeric, targetValue: 100, directionality: 'higher_is_better' },
      { id: 'i2', projectId: 'p1', name: 'Ind 2', description: '', unitOfMeasure: '', dataType: IndicatorDataType.Numeric, targetValue: 100, directionality: 'higher_is_better' }
    ];
    const dataPoints: DataPoint[] = [
      { id: 'd1', indicatorId: 'i1', actualValue: 95, collectionDate: '2024-03-01' }, // 95% -> On track
      { id: 'd2', indicatorId: 'i2', actualValue: 60, collectionDate: '2024-03-01' }  // 60% -> Off track
    ];

    const portfolio = calculatePortfolioIndex(indicators, dataPoints);
    expect(portfolio.totalCount).toBe(2);
    expect(portfolio.averageAchievement).toBe(77.5); // (95 + 60) / 2
    expect(portfolio.onTrackPct).toBe(50); // 1 of 2 on track
  });

  // 12. Corrections to previously approved data
  it('accurately updates metric calculations when a data point is corrected', () => {
    const indicator: Indicator = {
      id: 'ind_12',
      projectId: 'proj_01',
      name: 'Clean Water Points Functional',
      description: 'Active water taps',
      unitOfMeasure: 'Taps',
      dataType: IndicatorDataType.Numeric,
      targetValue: 50,
      directionality: 'higher_is_better'
    };

    // Erroneous entry
    const initialDp: DataPoint = { id: 'dp_12', indicatorId: 'ind_12', actualValue: 20, collectionDate: '2024-03-01' };
    const initialMetrics = calculateIndicatorMetrics(indicator, initialDp);
    expect(initialMetrics.status).toBe(IndicatorStatus.OFF_TRACK);

    // Corrected entry (e.g. after DQA audit)
    const correctedDp: DataPoint = { ...initialDp, actualValue: 48, notes: 'Corrected after re-audit of District 2' };
    const correctedMetrics = calculateIndicatorMetrics(indicator, correctedDp);
    expect(correctedMetrics.status).toBe(IndicatorStatus.ON_TRACK);
    expect(correctedMetrics.achievementPercentage).toBe(96);
  });

});
