// src/lumpsum.ts
function getCompoundingPeriods(frequency) {
  switch (frequency) {
    case "daily":
      return 365;
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "annually":
      return 1;
    default:
      return 12;
  }
}
function calculateLumpsumFV(principal, annualRate, years, compoundingFrequency = "monthly") {
  if (years === 0) {
    return principal;
  }
  if (principal <= 0) {
    return 0;
  }
  if (annualRate === 0) {
    return principal;
  }
  const n = getCompoundingPeriods(compoundingFrequency);
  const rate = annualRate / n;
  const periods = n * years;
  const fv = principal * Math.pow(1 + rate, periods);
  return Math.round(fv * 100) / 100;
}
function calculateLumpsumFVReal(principal, annualRate, years, inflationRate, compoundingFrequency = "monthly") {
  const nominalFV = calculateLumpsumFV(principal, annualRate, years, compoundingFrequency);
  const inflationFactor = Math.pow(1 + inflationRate, years);
  const realFV = nominalFV / inflationFactor;
  return Math.round(realFV * 100) / 100;
}

// src/sip.ts
function getContributionsPerYear(frequency) {
  switch (frequency) {
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "annually":
      return 1;
    default:
      return 12;
  }
}
function calculateSIPFV(contribution, annualRate, years, contributionFrequency = "monthly", contributionAtStart = false) {
  if (years === 0) {
    return 0;
  }
  if (contribution <= 0) {
    return 0;
  }
  if (annualRate === 0) {
    const periodsPerYear = getContributionsPerYear(contributionFrequency);
    return contribution * periodsPerYear * years;
  }
  const m = getContributionsPerYear(contributionFrequency);
  const i = annualRate / m;
  const n = m * years;
  let fv = contribution * ((Math.pow(1 + i, n) - 1) / i);
  if (contributionAtStart) {
    fv *= 1 + i;
  }
  return Math.round(fv * 100) / 100;
}
function calculateSIPTotalContributions(contribution, years, contributionFrequency = "monthly") {
  const periodsPerYear = getContributionsPerYear(contributionFrequency);
  return contribution * periodsPerYear * years;
}
function calculateSIPFVReal(contribution, annualRate, years, inflationRate, contributionFrequency = "monthly", contributionAtStart = false) {
  const nominalFV = calculateSIPFV(
    contribution,
    annualRate,
    years,
    contributionFrequency,
    contributionAtStart
  );
  const inflationFactor = Math.pow(1 + inflationRate, years);
  const realFV = nominalFV / inflationFactor;
  return Math.round(realFV * 100) / 100;
}
function calculateSIPForGoal(goalAmount, annualRate, years, contributionFrequency = "monthly") {
  if (years === 0 || goalAmount <= 0) {
    return goalAmount;
  }
  if (annualRate === 0) {
    const periodsPerYear = getContributionsPerYear(contributionFrequency);
    return goalAmount / (periodsPerYear * years);
  }
  const m = getContributionsPerYear(contributionFrequency);
  const i = annualRate / m;
  const n = m * years;
  const contribution = goalAmount * i / (Math.pow(1 + i, n) - 1);
  return Math.round(contribution * 100) / 100;
}

// src/cagr.ts
function calculateCAGR(presentValue, futureValue, years) {
  if (years === 0) {
    return 0;
  }
  if (presentValue === 0) {
    return futureValue > 0 ? Infinity : 0;
  }
  if (futureValue <= 0) {
    return -1;
  }
  const cagr = Math.pow(futureValue / presentValue, 1 / years) - 1;
  return Math.round(cagr * 1e4) / 1e4;
}
function calculateRealRate(nominalRate, inflationRate) {
  if (inflationRate === -1) {
    return Infinity;
  }
  const realRate = (1 + nominalRate) / (1 + inflationRate) - 1;
  return Math.round(realRate * 1e4) / 1e4;
}
function calculateNominalRate(realRate, inflationRate) {
  const nominalRate = (1 + realRate) * (1 + inflationRate) - 1;
  return Math.round(nominalRate * 1e4) / 1e4;
}
function calculateEffectiveAnnualRate(nominalRate, compoundingPeriods) {
  if (compoundingPeriods === 0) {
    return nominalRate;
  }
  const ear = Math.pow(1 + nominalRate / compoundingPeriods, compoundingPeriods) - 1;
  return Math.round(ear * 1e4) / 1e4;
}
function calculateYearsToDouble(annualRate) {
  if (annualRate <= 0) {
    return Infinity;
  }
  const years = Math.log(2) / Math.log(1 + annualRate);
  return Math.round(years * 100) / 100;
}
function calculateYearsToMultiplier(annualRate, multiplier) {
  if (annualRate <= 0 || multiplier <= 1) {
    return multiplier <= 1 ? 0 : Infinity;
  }
  const years = Math.log(multiplier) / Math.log(1 + annualRate);
  return Math.round(years * 100) / 100;
}

// src/portfolio.ts
function validateAllocations(allocations) {
  const errors = [];
  if (!allocations || allocations.length === 0) {
    errors.push("At least one allocation is required");
  }
  allocations.forEach((alloc, index) => {
    if (!alloc.category || alloc.category.trim() === "") {
      errors.push(`Allocation ${index + 1}: Category name is required`);
    }
    if (alloc.percent < 0) {
      errors.push(`Allocation ${index + 1}: Percentage cannot be negative`);
    }
    if (alloc.percent > 100) {
      errors.push(`Allocation ${index + 1}: Single allocation cannot exceed 100%`);
    }
  });
  return {
    valid: errors.length === 0,
    errors
  };
}
function normalizeAllocations(allocations, strict = false) {
  if (!allocations || allocations.length === 0) {
    return {
      success: false,
      allocations: [],
      totalPercent: 0,
      error: "No allocations provided"
    };
  }
  const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
  if (strict) {
    if (Math.abs(totalPercent - 100) > 0.01) {
      return {
        success: false,
        allocations,
        totalPercent,
        error: `Allocations must sum to 100%. Current total: ${totalPercent.toFixed(2)}%`
      };
    }
    const normalized2 = allocations.map((a) => ({
      ...a,
      percentNormalized: a.percent
    }));
    return {
      success: true,
      allocations: normalized2,
      totalPercent: 100
    };
  }
  if (totalPercent === 0) {
    return {
      success: false,
      allocations,
      totalPercent: 0,
      error: "Total allocation percentage is 0%"
    };
  }
  const normalized = allocations.map((a) => ({
    ...a,
    percentNormalized: Math.round(a.percent / totalPercent * 100 * 100) / 100
  }));
  return {
    success: true,
    allocations: normalized,
    totalPercent: 100
  };
}
function calculateAllocatedAmounts(totalAmount, allocations) {
  return allocations.map((a) => ({
    ...a,
    amount: Math.round(totalAmount * (a.percentNormalized ?? a.percent) / 100 * 100) / 100
  }));
}
function generateYearlyBreakdown(principal, annualRate, years, mode, monthlyContribution = 0, inflationRate) {
  const breakdown = [];
  let currentBalance = mode === "lumpsum" ? principal : 0;
  const monthlyRate = annualRate / 12;
  for (let year = 1; year <= years; year++) {
    const startBalance = currentBalance;
    let yearlyContributions = 0;
    let yearlyInterest = 0;
    for (let month = 1; month <= 12; month++) {
      if (mode === "sip") {
        currentBalance += monthlyContribution;
        yearlyContributions += monthlyContribution;
      }
      const monthInterest = currentBalance * monthlyRate;
      yearlyInterest += monthInterest;
      currentBalance += monthInterest;
    }
    const endBalance = Math.round(currentBalance * 100) / 100;
    let inflationAdjusted;
    if (inflationRate !== void 0) {
      const inflationFactor = Math.pow(1 + inflationRate, year);
      inflationAdjusted = Math.round(endBalance / inflationFactor * 100) / 100;
    }
    breakdown.push({
      year,
      startBalance: Math.round(startBalance * 100) / 100,
      contributions: Math.round(yearlyContributions * 100) / 100,
      interest: Math.round(yearlyInterest * 100) / 100,
      endBalance,
      inflationAdjusted
    });
  }
  return breakdown;
}
function projectPortfolio(params) {
  const {
    mode,
    amount,
    durationYears,
    compounding,
    allocations,
    normalize,
    inflationRate,
    taxPercent
  } = params;
  const normResult = normalizeAllocations(allocations, !normalize);
  if (!normResult.success) {
    throw new Error(normResult.error || "Failed to normalize allocations");
  }
  const allocatedAmounts = calculateAllocatedAmounts(amount, normResult.allocations);
  const categoryProjections = allocatedAmounts.map((alloc) => {
    const allocAmount = alloc.amount ?? 0;
    const rate = alloc.expectedAnnualReturn;
    let projectedFV;
    let totalContributions;
    if (mode === "lumpsum" || mode === "goal") {
      projectedFV = calculateLumpsumFV(allocAmount, rate, durationYears, compounding);
      totalContributions = allocAmount;
    } else if (mode === "sip") {
      projectedFV = calculateSIPFV(allocAmount, rate, durationYears, "monthly");
      totalContributions = calculateSIPTotalContributions(allocAmount, durationYears, "monthly");
    } else {
      projectedFV = calculateLumpsumFV(allocAmount, rate, durationYears, compounding);
      totalContributions = allocAmount;
    }
    const returns = projectedFV - totalContributions;
    if (taxPercent && returns > 0) {
      const taxAmount = returns * taxPercent;
      projectedFV = projectedFV - taxAmount;
    }
    const cagr = calculateCAGR(totalContributions, projectedFV, durationYears);
    let realFV;
    if (inflationRate !== void 0) {
      const inflationFactor = Math.pow(1 + inflationRate, durationYears);
      realFV = Math.round(projectedFV / inflationFactor * 100) / 100;
    }
    return {
      category: alloc.category,
      percentNormalized: alloc.percentNormalized ?? alloc.percent,
      amount: allocAmount,
      projectedFV: Math.round(projectedFV * 100) / 100,
      totalContributions: Math.round(totalContributions * 100) / 100,
      totalReturns: Math.round((projectedFV - totalContributions) * 100) / 100,
      cagr,
      realFV
    };
  });
  const aggregateFV = categoryProjections.reduce((sum, c) => sum + c.projectedFV, 0);
  const aggregateContributions = categoryProjections.reduce((sum, c) => sum + c.totalContributions, 0);
  const aggregateReturns = aggregateFV - aggregateContributions;
  const aggregateCAGR = calculateCAGR(aggregateContributions, aggregateFV, durationYears);
  let realAggregateFV;
  if (inflationRate !== void 0) {
    realAggregateFV = categoryProjections.reduce((sum, c) => sum + (c.realFV ?? 0), 0);
  }
  const yearlyBreakdown = [];
  const weightedRate = allocatedAmounts.reduce(
    (sum, a) => sum + a.expectedAnnualReturn * (a.percentNormalized ?? a.percent) / 100,
    0
  );
  if (mode === "lumpsum" || mode === "goal") {
    const breakdown = generateYearlyBreakdown(
      amount,
      weightedRate,
      durationYears,
      "lumpsum",
      0,
      inflationRate
    );
    yearlyBreakdown.push(...breakdown);
  } else if (mode === "sip") {
    const breakdown = generateYearlyBreakdown(
      0,
      weightedRate,
      durationYears,
      "sip",
      amount,
      inflationRate
    );
    yearlyBreakdown.push(...breakdown);
  }
  return {
    normalizedAllocations: categoryProjections,
    aggregate: {
      futureValue: Math.round(aggregateFV * 100) / 100,
      totalContributions: Math.round(aggregateContributions * 100) / 100,
      totalReturns: Math.round(aggregateReturns * 100) / 100,
      cagr: aggregateCAGR,
      realFutureValue: realAggregateFV ? Math.round(realAggregateFV * 100) / 100 : void 0
    },
    yearlyBreakdown
  };
}

// src/risk.ts
var DEFAULT_ASSET_CATEGORIES = [
  { id: "stocks", name: "Stocks", defaultExpectedReturn: 0.12, riskLevel: "high" },
  { id: "mutual_funds", name: "Mutual Funds", defaultExpectedReturn: 0.1, riskLevel: "medium" },
  { id: "etfs", name: "ETFs", defaultExpectedReturn: 0.09, riskLevel: "medium" },
  { id: "index_funds", name: "Index Funds", defaultExpectedReturn: 0.1, riskLevel: "medium" },
  { id: "reits", name: "REITs", defaultExpectedReturn: 0.08, riskLevel: "medium" },
  { id: "gold", name: "Gold", defaultExpectedReturn: 0.07, riskLevel: "low" },
  { id: "silver", name: "Silver", defaultExpectedReturn: 0.06, riskLevel: "medium" },
  { id: "bonds", name: "Bonds", defaultExpectedReturn: 0.07, riskLevel: "low" },
  { id: "fixed_deposits", name: "Fixed Deposits", defaultExpectedReturn: 0.065, riskLevel: "low" },
  { id: "cash", name: "Cash / Savings", defaultExpectedReturn: 0.04, riskLevel: "low" },
  { id: "crypto", name: "Crypto", defaultExpectedReturn: 0.15, riskLevel: "high" },
  { id: "real_estate", name: "Real Estate", defaultExpectedReturn: 0.09, riskLevel: "medium" },
  { id: "p2p", name: "P2P Lending", defaultExpectedReturn: 0.11, riskLevel: "high" },
  { id: "ppf", name: "PPF", defaultExpectedReturn: 0.071, riskLevel: "low" },
  { id: "nps", name: "NPS", defaultExpectedReturn: 0.09, riskLevel: "medium" }
];
function getDefaultExpectedReturn(category) {
  const found = DEFAULT_ASSET_CATEGORIES.find(
    (c) => c.id === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase()
  );
  return found?.defaultExpectedReturn ?? 0.08;
}
var ALLOCATION_PRESETS = {
  conservative: [
    { category: "Fixed Deposits", percent: 30, expectedAnnualReturn: 0.065 },
    { category: "Bonds", percent: 25, expectedAnnualReturn: 0.07 },
    { category: "Gold", percent: 15, expectedAnnualReturn: 0.07 },
    { category: "Mutual Funds", percent: 15, expectedAnnualReturn: 0.09 },
    { category: "PPF", percent: 10, expectedAnnualReturn: 0.071 },
    { category: "Cash / Savings", percent: 5, expectedAnnualReturn: 0.04 }
  ],
  balanced: [
    { category: "Mutual Funds", percent: 30, expectedAnnualReturn: 0.1 },
    { category: "Stocks", percent: 25, expectedAnnualReturn: 0.12 },
    { category: "Index Funds", percent: 15, expectedAnnualReturn: 0.1 },
    { category: "Bonds", percent: 10, expectedAnnualReturn: 0.07 },
    { category: "Gold", percent: 10, expectedAnnualReturn: 0.07 },
    { category: "REITs", percent: 10, expectedAnnualReturn: 0.08 }
  ],
  aggressive: [
    { category: "Stocks", percent: 40, expectedAnnualReturn: 0.12 },
    { category: "Mutual Funds", percent: 25, expectedAnnualReturn: 0.11 },
    { category: "ETFs", percent: 15, expectedAnnualReturn: 0.1 },
    { category: "Crypto", percent: 10, expectedAnnualReturn: 0.15 },
    { category: "P2P Lending", percent: 5, expectedAnnualReturn: 0.11 },
    { category: "REITs", percent: 5, expectedAnnualReturn: 0.08 }
  ]
};
var RISK_QUESTIONS = [
  {
    id: "age_group",
    question: "What is your age group?",
    options: [
      { value: 5, label: "18-30" },
      { value: 4, label: "31-40" },
      { value: 3, label: "41-50" },
      { value: 2, label: "51-60" },
      { value: 1, label: "60+" }
    ],
    weight: 1.5
  },
  {
    id: "investment_horizon",
    question: "What is your investment time horizon?",
    options: [
      { value: 5, label: "10+ years" },
      { value: 4, label: "5-10 years" },
      { value: 3, label: "3-5 years" },
      { value: 2, label: "1-3 years" },
      { value: 1, label: "Less than 1 year" }
    ],
    weight: 2
  },
  {
    id: "loss_reaction",
    question: "If your investments dropped 20% in value, you would:",
    options: [
      { value: 5, label: "Buy more at lower prices" },
      { value: 4, label: "Hold and wait for recovery" },
      { value: 3, label: "Wait and see, might sell if it drops more" },
      { value: 2, label: "Sell some to limit losses" },
      { value: 1, label: "Sell everything immediately" }
    ],
    weight: 2
  },
  {
    id: "income_stability",
    question: "How stable is your income?",
    options: [
      { value: 5, label: "Very stable (government job, established business)" },
      { value: 4, label: "Stable (salaried with good job security)" },
      { value: 3, label: "Moderately stable (private sector)" },
      { value: 2, label: "Variable (freelance, commissions)" },
      { value: 1, label: "Unstable or currently unemployed" }
    ],
    weight: 1.5
  },
  {
    id: "emergency_fund",
    question: "Do you have an emergency fund covering 6+ months of expenses?",
    options: [
      { value: 5, label: "Yes, more than 12 months" },
      { value: 4, label: "Yes, 6-12 months" },
      { value: 3, label: "Yes, 3-6 months" },
      { value: 2, label: "Less than 3 months" },
      { value: 1, label: "No emergency fund" }
    ],
    weight: 1.5
  },
  {
    id: "investment_knowledge",
    question: "How would you rate your investment knowledge?",
    options: [
      { value: 5, label: "Expert - I actively manage investments" },
      { value: 4, label: "Advanced - I understand most concepts" },
      { value: 3, label: "Intermediate - I know basics" },
      { value: 2, label: "Basic - Just starting to learn" },
      { value: 1, label: "Beginner - No experience" }
    ],
    weight: 1
  },
  {
    id: "risk_return_preference",
    question: "Which statement best describes your preference?",
    options: [
      { value: 5, label: "Maximum growth, I can handle high volatility" },
      { value: 4, label: "High growth with some volatility tolerance" },
      { value: 3, label: "Balanced growth with moderate risk" },
      { value: 2, label: "Steady growth with low risk" },
      { value: 1, label: "Capital preservation is most important" }
    ],
    weight: 2
  },
  {
    id: "financial_goals",
    question: "What is your primary financial goal?",
    options: [
      { value: 5, label: "Wealth accumulation / FIRE" },
      { value: 4, label: "Retirement planning (10+ years away)" },
      { value: 3, label: "Major purchase (home, education)" },
      { value: 2, label: "Short-term savings goal" },
      { value: 1, label: "Emergency fund building" }
    ],
    weight: 1.5
  }
];
function calculateRiskScore(answers) {
  if (!answers || answers.length === 0) {
    return 50;
  }
  let totalWeightedScore = 0;
  let totalWeight = 0;
  answers.forEach((answer) => {
    const question = RISK_QUESTIONS.find((q) => q.id === answer.questionId);
    if (question) {
      totalWeightedScore += answer.score * question.weight;
      totalWeight += question.weight * 5;
    }
  });
  if (totalWeight === 0) {
    return 50;
  }
  const score = totalWeightedScore / totalWeight * 100;
  return Math.round(score);
}
function getRiskProfile(score) {
  if (score >= 70) {
    return "aggressive";
  } else if (score >= 40) {
    return "balanced";
  } else {
    return "conservative";
  }
}
function assessRisk(answers) {
  const score = calculateRiskScore(answers);
  const profile = getRiskProfile(score);
  const suggestedAllocations = ALLOCATION_PRESETS[profile];
  return {
    profile,
    score,
    suggestedAllocations: suggestedAllocations.map((a) => ({
      ...a,
      percentNormalized: a.percent
    }))
  };
}
function calculateEmergencyFund(monthlyExpenses, riskProfile) {
  const multipliers = {
    conservative: { min: 6, rec: 9, ideal: 12 },
    balanced: { min: 6, rec: 8, ideal: 10 },
    aggressive: { min: 3, rec: 6, ideal: 8 }
  };
  const m = multipliers[riskProfile];
  return {
    minimum: monthlyExpenses * m.min,
    recommended: monthlyExpenses * m.rec,
    ideal: monthlyExpenses * m.ideal
  };
}
function calculateFIRENumber(annualExpenses, withdrawalRate = 0.04) {
  if (withdrawalRate <= 0) {
    return Infinity;
  }
  return Math.round(annualExpenses / withdrawalRate);
}
function estimateYearsToFIRE(currentSavings, monthlyContribution, expectedReturn, fireNumber) {
  if (currentSavings >= fireNumber) {
    return 0;
  }
  if (monthlyContribution <= 0 && expectedReturn <= 0) {
    return Infinity;
  }
  let low = 0;
  let high = 100;
  while (high - low > 0.1) {
    const mid = (low + high) / 2;
    const lumpsumFV = currentSavings * Math.pow(1 + expectedReturn, mid);
    const sipFV = monthlyContribution > 0 ? monthlyContribution * ((Math.pow(1 + expectedReturn / 12, mid * 12) - 1) / (expectedReturn / 12)) : 0;
    const totalFV = lumpsumFV + sipFV;
    if (totalFV >= fireNumber) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return Math.round(high * 10) / 10;
}

// src/monteCarlo.ts
function generateRandomReturn(mean, stdDev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}
function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const index = p / 100 * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedArr[lower];
  return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (index - lower);
}
function standardDeviation(values, mean) {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}
function runMonteCarloSimulation(params) {
  const {
    mode,
    amount,
    durationYears,
    expectedReturn,
    volatility,
    simulations = 1e3,
    compounding = "monthly",
    inflationRate
  } = params;
  const periodsPerYear = getCompoundingPeriods(compounding);
  const periodReturn = expectedReturn / periodsPerYear;
  const periodVolatility = volatility / Math.sqrt(periodsPerYear);
  const totalPeriods = durationYears * periodsPerYear;
  const allFinalValues = [];
  const allYearlyValues = Array.from({ length: durationYears }, () => []);
  const totalContributions = mode === "lumpsum" ? amount : amount * periodsPerYear * durationYears;
  for (let sim = 0; sim < simulations; sim++) {
    let balance = mode === "lumpsum" ? amount : 0;
    const yearlyValues = [];
    for (let period = 1; period <= totalPeriods; period++) {
      if (mode === "sip") {
        balance += amount;
      }
      const randomReturn = generateRandomReturn(periodReturn, periodVolatility);
      balance *= 1 + randomReturn;
      if (period % periodsPerYear === 0) {
        const year = period / periodsPerYear;
        let yearEndValue = balance;
        if (inflationRate !== void 0) {
          yearEndValue = balance / Math.pow(1 + inflationRate, year);
        }
        yearlyValues.push(yearEndValue);
        allYearlyValues[year - 1].push(yearEndValue);
      }
    }
    let finalValue = balance;
    if (inflationRate !== void 0) {
      finalValue = balance / Math.pow(1 + inflationRate, durationYears);
    }
    allFinalValues.push(finalValue);
  }
  allFinalValues.sort((a, b) => a - b);
  const mean = allFinalValues.reduce((a, b) => a + b, 0) / allFinalValues.length;
  const median = percentile(allFinalValues, 50);
  const min = allFinalValues[0];
  const max = allFinalValues[allFinalValues.length - 1];
  const stdDev = standardDeviation(allFinalValues, mean);
  const p10 = percentile(allFinalValues, 10);
  const p25 = percentile(allFinalValues, 25);
  const p50 = median;
  const p75 = percentile(allFinalValues, 75);
  const p90 = percentile(allFinalValues, 90);
  const confidenceIntervals = [
    { percentile: 5, value: percentile(allFinalValues, 5) },
    { percentile: 10, value: p10 },
    { percentile: 25, value: p25 },
    { percentile: 50, value: p50 },
    { percentile: 75, value: p75 },
    { percentile: 90, value: p90 },
    { percentile: 95, value: percentile(allFinalValues, 95) }
  ];
  const probDouble = allFinalValues.filter((v) => v >= totalContributions * 2).length / simulations;
  const probLoss = allFinalValues.filter((v) => v < totalContributions).length / simulations;
  const yearlyBands = allYearlyValues.map((yearValues, idx) => {
    yearValues.sort((a, b) => a - b);
    return {
      year: idx + 1,
      p10: percentile(yearValues, 10),
      p25: percentile(yearValues, 25),
      p50: percentile(yearValues, 50),
      p75: percentile(yearValues, 75),
      p90: percentile(yearValues, 90)
    };
  });
  return {
    simulationCount: simulations,
    finalValues: allFinalValues,
    statistics: {
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      standardDeviation: Math.round(stdDev * 100) / 100
    },
    percentiles: {
      p10: Math.round(p10 * 100) / 100,
      p25: Math.round(p25 * 100) / 100,
      p50: Math.round(p50 * 100) / 100,
      p75: Math.round(p75 * 100) / 100,
      p90: Math.round(p90 * 100) / 100
    },
    confidenceIntervals,
    probabilityMetrics: {
      probDouble: Math.round(probDouble * 1e3) / 10,
      // Percentage
      probLoss: Math.round(probLoss * 1e3) / 10
    },
    yearlyBands
  };
}
var DEFAULT_VOLATILITY = {
  stocks: 0.2,
  // 20% - High volatility
  mutual_funds: 0.15,
  // 15% - Medium-high
  etfs: 0.16,
  // 16% - Similar to mutual funds
  index_funds: 0.15,
  // 15% - Market volatility
  reits: 0.18,
  // 18% - High volatility
  gold: 0.12,
  // 12% - Medium volatility
  silver: 0.22,
  // 22% - Very high volatility
  bonds: 0.06,
  // 6% - Low volatility
  fixed_deposits: 0.01,
  // 1% - Very low (rate changes only)
  cash: 0.02,
  // 2% - Very low
  crypto: 0.6,
  // 60% - Extreme volatility
  real_estate: 0.1,
  // 10% - Medium-low
  p2p: 0.15,
  // 15% - Medium-high (default risk)
  ppf: 0.01,
  // 1% - Very low (government backed)
  nps: 0.12
  // 12% - Medium (mixed assets)
};
function getDefaultVolatility(category) {
  const key = category.toLowerCase().replace(/\s+/g, "_");
  return DEFAULT_VOLATILITY[key] ?? 0.15;
}
function calculatePortfolioVolatility(allocations) {
  const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
  if (totalPercent === 0) return 0.15;
  let weightedVolatility = 0;
  for (const alloc of allocations) {
    const weight = alloc.percent / totalPercent;
    const volatility = getDefaultVolatility(alloc.category);
    weightedVolatility += weight * volatility;
  }
  return Math.round(weightedVolatility * 1e3) / 1e3;
}
export {
  ALLOCATION_PRESETS,
  DEFAULT_ASSET_CATEGORIES,
  DEFAULT_VOLATILITY,
  RISK_QUESTIONS,
  assessRisk,
  calculateAllocatedAmounts,
  calculateCAGR,
  calculateEffectiveAnnualRate,
  calculateEmergencyFund,
  calculateFIRENumber,
  calculateLumpsumFV,
  calculateLumpsumFVReal,
  calculateNominalRate,
  calculatePortfolioVolatility,
  calculateRealRate,
  calculateRiskScore,
  calculateSIPFV,
  calculateSIPFVReal,
  calculateSIPForGoal,
  calculateSIPTotalContributions,
  calculateYearsToDouble,
  calculateYearsToMultiplier,
  estimateYearsToFIRE,
  getCompoundingPeriods,
  getContributionsPerYear,
  getDefaultExpectedReturn,
  getDefaultVolatility,
  getRiskProfile,
  normalizeAllocations,
  projectPortfolio,
  runMonteCarloSimulation,
  validateAllocations
};
