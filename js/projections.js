const Projections = (function () {
  function buildAmortizationSchedule(inputs, years) {
    const loanAmount = inputs.price * (1 - inputs.downPct / 100);
    const monthlyRate = (inputs.rate / 100) / 12;
    const numPayments = inputs.termYears * 12;

    let monthlyPI = 0;
    if (loanAmount > 0) {
      monthlyPI = monthlyRate === 0
        ? loanAmount / numPayments
        : loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    let balance = loanAmount;
    const schedule = [];
    const monthsToProject = Math.min(years * 12, numPayments);
    let yearPrincipal = 0, yearInterest = 0;

    for (let m = 1; m <= monthsToProject; m++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(monthlyPI - interestPayment, balance);
      balance = Math.max(balance - principalPayment, 0);
      yearPrincipal += principalPayment;
      yearInterest += interestPayment;
      if (m % 12 === 0 || m === monthsToProject) {
        schedule.push({
          year: Math.ceil(m / 12),
          principalPaid: yearPrincipal,
          interestPaid: yearInterest,
          endBalance: balance
        });
        yearPrincipal = 0;
        yearInterest = 0;
      }
    }
    const lastYearComputed = schedule.length ? schedule[schedule.length - 1].year : 0;
    for (let y = lastYearComputed + 1; y <= years; y++) {
      schedule.push({ year: y, principalPaid: 0, interestPaid: 0, endBalance: 0 });
    }
    return schedule;
  }

  function calculateIRR(cashFlows, guessLow, guessHigh) {
    function npv(rate) {
      return cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i), 0);
    }
    let lo = guessLow !== undefined ? guessLow : -0.9;
    let hi = guessHigh !== undefined ? guessHigh : 5.0;
    let npvLo = npv(lo);
    let npvHi = npv(hi);
    if (npvLo === 0) return lo;
    if (npvHi === 0) return hi;
    if ((npvLo < 0) === (npvHi < 0)) return null;

    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const npvMid = npv(mid);
      if (Math.abs(npvMid) < 1e-7) return mid;
      if ((npvLo < 0) === (npvMid < 0)) {
        lo = mid; npvLo = npvMid;
      } else {
        hi = mid; npvHi = npvMid;
      }
    }
    return (lo + hi) / 2;
  }

  function projectHold(inputs, options) {
    options = options || {};
    const holdYears = options.holdYears || 10;
    const appreciationPct = (options.appreciationPct !== undefined ? options.appreciationPct : 3) / 100;
    const rentGrowthPct = (options.rentGrowthPct !== undefined ? options.rentGrowthPct : 2) / 100;
    const expenseGrowthPct = (options.expenseGrowthPct !== undefined ? options.expenseGrowthPct : 2) / 100;
    const sellingCostPct = (options.sellingCostPct !== undefined ? options.sellingCostPct : 7) / 100;

    const amort = buildAmortizationSchedule(inputs, holdYears);
    const downPayment = inputs.price * (inputs.downPct / 100);
    const totalCashInvested = downPayment + inputs.closing + inputs.rehab;

    let cumulativeCashFlow = 0;
    const years = [];
    const cashFlowSeries = [-totalCashInvested];

    for (let y = 1; y <= holdYears; y++) {
      const grownInputs = {
        ...inputs,
        rent: inputs.rent * Math.pow(1 + rentGrowthPct, y - 1),
        tax: inputs.tax * Math.pow(1 + expenseGrowthPct, y - 1),
        insurance: inputs.insurance * Math.pow(1 + expenseGrowthPct, y - 1),
        hoaMonthly: inputs.hoaMonthly * Math.pow(1 + expenseGrowthPct, y - 1),
        otherMonthly: inputs.otherMonthly * Math.pow(1 + expenseGrowthPct, y - 1)
      };
      const m = Calc.computeMetrics(grownInputs);
      const yearAmort = amort.find(a => a.year === y) || { endBalance: 0 };
      const propertyValue = inputs.price * Math.pow(1 + appreciationPct, y);
      const equity = propertyValue - yearAmort.endBalance;

      cumulativeCashFlow += m.annualCashFlow;
      cashFlowSeries.push(m.annualCashFlow);

      years.push({
        year: y,
        rent: grownInputs.rent,
        annualCashFlow: m.annualCashFlow,
        cumulativeCashFlow,
        propertyValue,
        loanBalance: yearAmort.endBalance,
        equity,
        totalReturnToDate: cumulativeCashFlow + (equity - totalCashInvested)
      });
    }

    const last = years[years.length - 1];
    const sellingCosts = last ? last.propertyValue * sellingCostPct : 0;
    const netSaleProceeds = last ? last.equity - sellingCosts : 0;

    const irrCashFlows = cashFlowSeries.slice();
    if (irrCashFlows.length > 1) {
      irrCashFlows[irrCashFlows.length - 1] += netSaleProceeds;
    }
    const irr = calculateIRR(irrCashFlows);

    const totalCashReceived = (last ? last.cumulativeCashFlow : 0) + netSaleProceeds;
    const totalProfit = totalCashReceived - totalCashInvested;
    const totalReturnMultiple = totalCashInvested > 0 ? totalCashReceived / totalCashInvested : 0;

    return {
      years,
      totalCashInvested,
      sellingCosts,
      netSaleProceeds,
      totalProfit,
      totalReturnMultiple,
      irr
    };
  }

  return { buildAmortizationSchedule, calculateIRR, projectHold };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Projections;
}
