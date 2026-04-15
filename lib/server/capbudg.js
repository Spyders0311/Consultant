function toNum(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clampInt(value, min, max) {
  const intVal = Math.trunc(toNum(value, min));
  return Math.max(min, Math.min(max, intVal));
}

function computeIrr(cashFlows, guess = 0.1) {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2) return null;
  if (!cashFlows.some((x) => x > 0) || !cashFlows.some((x) => x < 0)) return null;

  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dNpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const denom = (1 + rate) ** t;
      npv += cashFlows[t] / denom;
      if (t > 0) dNpv += (-t * cashFlows[t]) / ((1 + rate) ** (t + 1));
    }

    if (Math.abs(npv) < 1e-9) return rate;
    if (Math.abs(dNpv) < 1e-12) break;

    const next = rate - npv / dNpv;
    if (next <= -0.99 || !Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-10) return next;
    rate = next;
  }

  let low = -0.9;
  let high = 5;
  const f = (r) => cashFlows.reduce((acc, cf, t) => acc + cf / ((1 + r) ** t), 0);
  let fLow = f(low);
  let fHigh = f(high);
  if (fLow * fHigh > 0) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const fMid = f(mid);
    if (Math.abs(fMid) < 1e-9) return mid;
    if (fLow * fMid < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return (low + high) / 2;
}

function buildRateArray(length, provided = [], fallback = 0) {
  const out = new Array(length).fill(fallback);
  for (let i = 0; i < Math.min(length, provided.length); i++) {
    if (provided[i] === '' || provided[i] === null || provided[i] === undefined) continue;
    out[i] = toNum(provided[i], fallback);
  }
  return out;
}

function depreciationSchedule({ initialInvestment, salvageValue, lifetime, method }) {
  const dep = [];
  const bookBegin = [];
  const bookEnd = [];

  let currentBook = initialInvestment;
  const straightDep = lifetime > 0 ? (initialInvestment - salvageValue) / lifetime : 0;
  const ddbRate = lifetime > 0 ? 2 / lifetime : 0;

  for (let y = 1; y <= lifetime; y++) {
    bookBegin.push(currentBook);

    let depreciation = 0;
    if (method === 1) {
      depreciation = Math.max(0, straightDep);
    } else {
      const candidate = currentBook * ddbRate;
      depreciation = Math.max(0, Math.min(candidate, currentBook - salvageValue));
    }

    currentBook = Math.max(salvageValue, currentBook - depreciation);
    dep.push(depreciation);
    bookEnd.push(currentBook);
  }

  return { dep, bookBegin, bookEnd };
}

export function calculateCapBudg(rawInput) {
  const lifetime = clampInt(rawInput.lifetime ?? 10, 1, 40);

  const initialInvestment = toNum(rawInput.initialInvestment, 50000);
  const opportunityCost = toNum(rawInput.opportunityCost, 7484);
  const salvageValue = toNum(rawInput.salvageValue, 10000);
  const depreciationMethod = clampInt(rawInput.depreciationMethod ?? 2, 1, 2);
  const taxCreditRate = toNum(rawInput.taxCreditRate, 0.1);
  const otherInvestment = toNum(rawInput.otherInvestment, 0);

  const workingCapitalInitial = toNum(rawInput.workingCapitalInitial, 10000);
  const workingCapitalPercent = toNum(rawInput.workingCapitalPercent, 0.25);
  const workingCapitalSalvageFraction = toNum(rawInput.workingCapitalSalvageFraction, 1);

  const revenueYear1 = toNum(rawInput.revenueYear1, 40000);
  const variableExpensePercent = toNum(rawInput.variableExpensePercent, 0.5);
  const fixedExpenseYear1 = toNum(rawInput.fixedExpenseYear1, 0);
  const taxRate = toNum(rawInput.taxRate, 0.4);

  const discountApproach = clampInt(rawInput.discountApproach ?? 2, 1, 2);
  const discountRateDirect = toNum(rawInput.discountRateDirect, 0.1);
  const beta = toNum(rawInput.beta, 0.9);
  const riskFreeRate = toNum(rawInput.riskFreeRate, 0.08);
  const marketRiskPremium = toNum(rawInput.marketRiskPremium, 0.055);
  const debtRatio = toNum(rawInput.debtRatio, 0.3);
  const costOfBorrowing = toNum(rawInput.costOfBorrowing, 0.09);

  const revenueGrowthRates = buildRateArray(lifetime - 1, rawInput.revenueGrowthRates, 0);
  const fixedExpenseGrowthRates = buildRateArray(
    lifetime - 1,
    rawInput.fixedExpenseGrowthRates,
    null,
  ).map((v, i) => (v === null ? revenueGrowthRates[i] : v));

  const discountRateUsed =
    discountApproach === 1
      ? discountRateDirect
      : (riskFreeRate + beta * marketRiskPremium) * (1 - debtRatio) +
        costOfBorrowing * (1 - taxRate) * debtRatio;

  const grossInvestment = initialInvestment;
  const taxCredit = grossInvestment * taxCreditRate;
  const netInvestment = grossInvestment - taxCredit;
  const initialOutflow =
    netInvestment + workingCapitalInitial + opportunityCost + otherInvestment;

  const { dep, bookBegin, bookEnd } = depreciationSchedule({
    initialInvestment,
    salvageValue,
    lifetime,
    method: depreciationMethod,
  });

  const revenues = [];
  const varExpenses = [];
  const fixedExpenses = [];
  const ebitda = [];
  const ebit = [];
  const taxes = [];
  const ebitAfterTax = [];
  const deltaWorkingCapital = [];
  const natcf = [];
  const salvageEquipment = [];
  const salvageWorkingCapital = [];
  const discountedCashFlow = [];

  let cumulativeWorkingCapital = workingCapitalInitial;

  for (let y = 1; y <= lifetime; y++) {
    const prevRevenue = y === 1 ? revenueYear1 : revenues[y - 2];
    const revenueGrowth = y === 1 ? 0 : revenueGrowthRates[y - 2];
    const rev = y === 1 ? revenueYear1 : prevRevenue * (1 + revenueGrowth);
    revenues.push(rev);

    const varExp = rev * variableExpensePercent;
    varExpenses.push(varExp);

    const prevFixedExpense = y === 1 ? fixedExpenseYear1 : fixedExpenses[y - 2];
    const fixedGrowth = y === 1 ? 0 : fixedExpenseGrowthRates[y - 2];
    const fixedExp = y === 1 ? fixedExpenseYear1 : prevFixedExpense * (1 + fixedGrowth);
    fixedExpenses.push(fixedExp);

    const ebitdaYear = rev - varExp - fixedExp;
    ebitda.push(ebitdaYear);

    const depYear = dep[y - 1];
    const ebitYear = ebitdaYear - depYear;
    ebit.push(ebitYear);

    const taxYear = ebitYear * taxRate;
    taxes.push(taxYear);

    const ebitAfterTaxYear = ebitYear - taxYear;
    ebitAfterTax.push(ebitAfterTaxYear);

    const targetWc = workingCapitalPercent * rev;
    const deltaWc = targetWc - cumulativeWorkingCapital;
    cumulativeWorkingCapital = targetWc;
    deltaWorkingCapital.push(deltaWc);

    const natcfYear = ebitAfterTaxYear + depYear - deltaWc;
    natcf.push(natcfYear);

    const salvageEq = y === lifetime ? salvageValue : 0;
    salvageEquipment.push(salvageEq);

    const salvageWc = y === lifetime ? cumulativeWorkingCapital * workingCapitalSalvageFraction : 0;
    salvageWorkingCapital.push(salvageWc);

    const pv = (natcfYear + salvageEq + salvageWc) / (1 + discountRateUsed) ** y;
    discountedCashFlow.push(pv);
  }

  const npv = -initialOutflow + discountedCashFlow.reduce((a, b) => a + b, 0);
  const irrCashFlows = [-initialOutflow, ...natcf];
  const irr = computeIrr(irrCashFlows, discountRateUsed);

  const rocNumerator = ebitAfterTax.reduce((a, b) => a + b, 0);
  const rocDenominator = [initialInvestment, ...bookEnd.slice(0, -1)].reduce((a, b) => a + b, 0);
  const roc = rocDenominator === 0 ? null : rocNumerator / rocDenominator;

  return {
    summary: {
      discountRateUsed,
      initialOutflow,
      npv,
      irr,
      roc,
      taxCredit,
      netInvestment,
    },
    annual: Array.from({ length: lifetime }, (_, i) => ({
      year: i + 1,
      revenue: revenues[i],
      variableExpense: varExpenses[i],
      fixedExpense: fixedExpenses[i],
      ebitda: ebitda[i],
      depreciation: dep[i],
      ebit: ebit[i],
      tax: taxes[i],
      ebitAfterTax: ebitAfterTax[i],
      deltaWorkingCapital: deltaWorkingCapital[i],
      natcf: natcf[i],
      salvageEquipment: salvageEquipment[i],
      salvageWorkingCapital: salvageWorkingCapital[i],
      discountedCashFlow: discountedCashFlow[i],
      bookValueBegin: bookBegin[i],
      bookValueEnd: bookEnd[i],
    })),
    inputs: {
      lifetime,
      discountApproach,
      depreciationMethod,
      revenueGrowthRates,
      fixedExpenseGrowthRates,
    },
  };
}
