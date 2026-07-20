const { createRunner } = require('./helpers');
const Calc = require('../js/calc.js');
const { test, assertClose, done } = createRunner('test-calc.js');

const baseInputs = {
  price: 350000, downPct: 20, rate: 6.75, termYears: 30,
  closing: 7000, rehab: 5000, rent: 2900, vacancyPct: 5,
  tax: 4200, insurance: 1600, hoaMonthly: 0, maintPct: 6, mgmtPct: 8, otherMonthly: 0
};

test('computeMetrics: loan amount is price minus down payment', () => {
  const m = Calc.computeMetrics(baseInputs);
  assertClose(m.loanAmount, 350000 * 0.8, 0.01);
});

test('computeMetrics: monthly P&I matches standard amortization formula', () => {
  const m = Calc.computeMetrics(baseInputs);
  const loan = 280000;
  const r = 0.0675 / 12;
  const n = 360;
  const expected = loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  assertClose(m.monthlyPI, expected, 0.01);
});

test('computeMetrics: zero-rate loan divides evenly across payments', () => {
  const m = Calc.computeMetrics({ ...baseInputs, rate: 0 });
  assertClose(m.monthlyPI, 280000 / 360, 0.01);
});

test('computeMetrics: cap rate is NOI divided by price', () => {
  const m = Calc.computeMetrics(baseInputs);
  assertClose(m.capRate, (m.noi / 350000) * 100, 0.001);
});

test('computeMetrics: cash-on-cash is annual cash flow divided by total cash invested', () => {
  const m = Calc.computeMetrics(baseInputs);
  assertClose(m.cashOnCash, (m.annualCashFlow / m.totalCashInvested) * 100, 0.001);
});

test('computeMetrics: DSCR is NOI divided by annual debt service', () => {
  const m = Calc.computeMetrics(baseInputs);
  assertClose(m.dscr, m.noi / m.annualDebtService, 0.001);
});

test('applyScenario downside: rent down 10%, vacancy +5pp, maintenance +2pp, rate +1.0pp', () => {
  const s = Calc.applyScenario(baseInputs, 'downside');
  assertClose(s.rent, 2900 * 0.9, 0.01);
  assertClose(s.vacancyPct, 10, 0.001);
  assertClose(s.maintPct, 8, 0.001);
  assertClose(s.rate, 7.75, 0.001);
});

test('applyScenario upside: rent up 5%, vacancy -2pp (floored at 0), rate -0.25pp', () => {
  const s = Calc.applyScenario(baseInputs, 'upside');
  assertClose(s.rent, 2900 * 1.05, 0.01);
  assertClose(s.vacancyPct, 3, 0.001);
  assertClose(s.rate, 6.5, 0.001);
});

test('applyScenario upside: vacancy cannot go below 0', () => {
  const s = Calc.applyScenario({ ...baseInputs, vacancyPct: 1 }, 'upside');
  assertClose(s.vacancyPct, 0, 0.001);
});

test('estimateRentOnePercent: defaults to 1% of price', () => {
  assertClose(Calc.estimateRentOnePercent(350000), 3500, 0.01);
});

test('estimateRentOnePercent: respects a custom percentage', () => {
  assertClose(Calc.estimateRentOnePercent(350000, 0.8), 2800, 0.01);
});

test('estimateRentFromComps: averages valid numeric comps, ignores blanks', () => {
  assertClose(Calc.estimateRentFromComps(['2800', '', '3000', 'abc']), 2900, 0.01);
});

test('estimateRentFromComps: returns 0 with no valid comps', () => {
  assertClose(Calc.estimateRentFromComps(['', 'abc']), 0, 0.001);
});

test('summarizePortfolio: empty portfolio returns all zeros', () => {
  const s = Calc.summarizePortfolio([]);
  assertClose(s.count, 0, 0);
  assertClose(s.blendedCapRate, 0, 0);
});

test('summarizePortfolio: blends cap rate across multiple deals', () => {
  const dealA = { inputs: baseInputs };
  const dealB = { inputs: { ...baseInputs, price: 250000, rent: 2200 } };
  const s = Calc.summarizePortfolio([dealA, dealB]);
  const mA = Calc.computeMetrics(dealA.inputs);
  const mB = Calc.computeMetrics(dealB.inputs);
  const expectedCapRate = ((mA.noi + mB.noi) / (350000 + 250000)) * 100;
  assertClose(s.blendedCapRate, expectedCapRate, 0.01);
  assertClose(s.count, 2, 0);
});

done();
