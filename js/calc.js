/**
 * calc.js
 * Pure calculation functions for deal underwriting. No DOM access here —
 * keeps the math independently testable (see /tests or run with Node).
 */
const Calc = (function () {
  function computeMetrics(inputs) {
    const {
      price, downPct, rate, termYears, closing, rehab, rent, vacancyPct,
      tax, insurance, hoaMonthly, maintPct, mgmtPct, otherMonthly
    } = inputs;

    const downPayment = price * (downPct / 100);
    const loanAmount = Math.max(price - downPayment, 0);
    const monthlyRate = (rate / 100) / 12;
    const numPayments = termYears * 12;

    let monthlyPI = 0;
    if (loanAmount > 0) {
      if (monthlyRate === 0) {
        monthlyPI = loanAmount / numPayments;
      } else {
        monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                    (Math.pow(1 + monthlyRate, numPayments) - 1);
      }
    }

    const grossAnnualRent = rent * 12;
    const vacancyLoss = grossAnnualRent * (Math.max(vacancyPct, 0) / 100);
    const effectiveGrossIncome = grossAnnualRent - vacancyLoss;

    const maintAnnual = grossAnnualRent * (Math.max(maintPct, 0) / 100);
    const mgmtAnnual = grossAnnualRent * (Math.max(mgmtPct, 0) / 100);
    const hoaAnnual = hoaMonthly * 12;
    const otherAnnual = otherMonthly * 12;

    const totalOperatingExpenses = tax + insurance + hoaAnnual + maintAnnual + mgmtAnnual + otherAnnual;
    const noi = effectiveGrossIncome - totalOperatingExpenses;

    const annualDebtService = monthlyPI * 12;
    const annualCashFlow = noi - annualDebtService;
    const monthlyCashFlow = annualCashFlow / 12;

    const capRate = price > 0 ? (noi / price) * 100 : 0;
    const totalCashInvested = downPayment + closing + rehab;
    const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

    return {
      downPayment, loanAmount, monthlyPI, effectiveGrossIncome, totalOperatingExpenses,
      noi, annualDebtService, annualCashFlow, monthlyCashFlow, capRate,
      totalCashInvested, cashOnCash, dscr
    };
  }

  // Applies a named stress scenario on top of a base input set.
  function applyScenario(inputs, scenario) {
    const s = { ...inputs };
    if (scenario === 'downside') {
      s.rent = inputs.rent * 0.90;
      s.vacancyPct = inputs.vacancyPct + 5;
      s.maintPct = inputs.maintPct + 2;
      s.rate = inputs.rate + 1.0;
    } else if (scenario === 'upside') {
      s.rent = inputs.rent * 1.05;
      s.vacancyPct = Math.max(inputs.vacancyPct - 2, 0);
      s.rate = Math.max(inputs.rate - 0.25, 0);
    }
    return s;
  }

  // Quick rule-of-thumb rent estimate: the "1% rule" (monthly rent ~1% of price).
  // This is a rough screening heuristic, not an appraisal or AVM.
  function estimateRentOnePercent(price, pct) {
    const p = (pct === undefined ? 1.0 : pct) / 100;
    return price * p;
  }

  // Averages user-supplied comparable rents.
  function estimateRentFromComps(comps) {
    const nums = (comps || []).map(Number).filter(n => !isNaN(n) && n > 0);
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  // Aggregates a list of {inputs} deals into a blended portfolio summary.
  function summarizePortfolio(deals) {
    if (!deals.length) {
      return { count: 0, totalMonthlyCashFlow: 0, totalCashInvested: 0, blendedCapRate: 0, blendedCashOnCash: 0 };
    }
    let totalMonthlyCashFlow = 0, totalCashInvested = 0, totalNOI = 0, totalPrice = 0, totalAnnualCashFlow = 0;
    deals.forEach(d => {
      const m = computeMetrics(d.inputs);
      totalMonthlyCashFlow += m.monthlyCashFlow;
      totalCashInvested += m.totalCashInvested;
      totalNOI += m.noi;
      totalPrice += d.inputs.price;
      totalAnnualCashFlow += m.annualCashFlow;
    });
    const blendedCapRate = totalPrice > 0 ? (totalNOI / totalPrice) * 100 : 0;
    const blendedCashOnCash = totalCashInvested > 0 ? (totalAnnualCashFlow / totalCashInvested) * 100 : 0;
    return {
      count: deals.length,
      totalMonthlyCashFlow,
      totalCashInvested,
      blendedCapRate,
      blendedCashOnCash
    };
  }

  return { computeMetrics, applyScenario, estimateRentOnePercent, estimateRentFromComps, summarizePortfolio };
})();

// Support both browser (global) and Node (module.exports) usage for testing.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Calc;
}
