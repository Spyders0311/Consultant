function toNum(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeYesNo(value, fallback = false) {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'yes' || v === 'true') return true;
    if (v === 'no' || v === 'false') return false;
  }
  if (typeof value === 'boolean') return value;
  return fallback;
}

export function calculateFcfeStableGrowth(rawInput) {
  const currentEarnings = toNum(rawInput.currentEarnings, 5.45);
  const capitalSpending = toNum(rawInput.capitalSpending, 2);
  const depreciation = toNum(rawInput.depreciation, 1.7469204927211646);
  const changeWorkingCapital = toNum(rawInput.changeWorkingCapital, 0.6);
  const debtRatio = toNum(rawInput.debtRatio, 0.2997);

  const offsetCapexByDep = normalizeYesNo(rawInput.offsetCapexByDep, false);
  const recomputeReinvestment = normalizeYesNo(rawInput.recomputeReinvestment, true);
  const roePerpetuity = toNum(rawInput.roePerpetuity, 0.12);

  const useDirectCostOfEquity = normalizeYesNo(rawInput.useDirectCostOfEquity, false);
  const directCostOfEquity = toNum(rawInput.directCostOfEquity, 0.12);
  const beta = toNum(rawInput.beta, 1.1);
  const riskFreeRate = toNum(rawInput.riskFreeRate, 0.07);
  const riskPremium = toNum(rawInput.riskPremium, 0.055);

  const expectedGrowth = toNum(rawInput.expectedGrowth, 0.06);

  const reinvestmentRate =
    currentEarnings === 0
      ? null
      : ((capitalSpending - depreciation + changeWorkingCapital) * (1 - debtRatio)) /
        currentEarnings;

  const debtFreeFactor = 1 - debtRatio;

  let adjustedCapexMinusDep;
  if (offsetCapexByDep) {
    adjustedCapexMinusDep = 0;
  } else if (recomputeReinvestment) {
    const targetReinvestment = currentEarnings * (expectedGrowth / roePerpetuity);
    adjustedCapexMinusDep =
      debtFreeFactor === 0
        ? targetReinvestment
        : (targetReinvestment - debtFreeFactor * changeWorkingCapital) / debtFreeFactor;
  } else {
    adjustedCapexMinusDep = capitalSpending - depreciation;
  }

  const debtAdjustedCapex = debtFreeFactor * adjustedCapexMinusDep;
  const debtAdjustedWc = debtFreeFactor * changeWorkingCapital;
  const fcfe = currentEarnings - debtAdjustedCapex - debtAdjustedWc;

  const costOfEquity =
    useDirectCostOfEquity ? directCostOfEquity : riskFreeRate + beta * riskPremium;

  const intrinsicValue =
    costOfEquity <= expectedGrowth ? null : (fcfe * (1 + expectedGrowth)) / (costOfEquity - expectedGrowth);

  const warnings = [];
  if (expectedGrowth > 0.1) warnings.push('Expected growth is high for a stable-growth assumption.');
  if (beta > 1.5) warnings.push('Beta appears high for a stable firm.');
  if (capitalSpending > 1.5 * depreciation) {
    warnings.push('Capital spending appears high relative to depreciation.');
  }

  const sensitivity = [];
  for (let i = 4; i >= -4; i--) {
    const growth = expectedGrowth + i * 0.01;
    const value = costOfEquity <= growth ? null : (fcfe * (1 + growth)) / (costOfEquity - growth);
    sensitivity.push({ growth, value });
  }

  return {
    summary: {
      reinvestmentRate,
      adjustedCapexMinusDep,
      debtAdjustedCapex,
      debtAdjustedWc,
      fcfe,
      costOfEquity,
      expectedGrowth,
      intrinsicValue,
    },
    warnings,
    sensitivity,
  };
}
