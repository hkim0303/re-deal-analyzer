const { createRunner } = require('./helpers');
const Calc = require('../js/calc.js');
global.Calc = Calc; // projections.js expects Calc as a global, same as it does in the browser
const Projections = require('../js/projections.js');
const { test, assertClose, done } = createRunner('test-projections.js');

test('calculateIRR: lump-sum cash flow resolves to exactly 10.000% IRR', () => {
  const irr = Projections.calculateIRR([-1000, 0, 0, 0, 0, 1610.51]);
  assertClose(irr * 100, 10.000, 0.001);
});

test('calculateIRR: textbook 5-year annuity resolves to ~15.238% IRR', () => {
  const irr = Projections.calculateIRR([-1000, 300, 300, 300, 300, 300]);
  assertClose(irr * 100, 15.238, 0.01);
});

test('calculateIRR: returns null when there is no sign change in cash flows', () => {
  const irr = Projections.calculateIRR([100, 100, 100]);
  if (irr !== null) throw new Error('expected null for an all-positive cash flow series, got ' + irr);
});

test('buildAmortizationSchedule: principal paid across the full term sums to the loan amount', () => {
  const inputs = { price: 350000, downPct: 20, rate: 6.75, termYears: 30 };
  const schedule = Projections.buildAmortizationSchedule(inputs, 30);
  const totalPrincipal = schedule.reduce((sum, y) => sum + y.principalPaid, 0);
  assertClose(totalPrincipal, 280000, 1);
});

test('buildAmortizationSchedule: loan balance decreases monotonically year over year', () => {
  const inputs = { price: 350000, downPct: 20, rate: 6.75, termYears: 30 };
  const schedule = Projections.buildAmortizationSchedule(inputs, 30);
  for (let i = 1; i < schedule.length; i++) {
    if (schedule[i].endBalance > schedule[i - 1].endBalance + 0.01) {
      throw new Error('balance increased between year ' + schedule[i - 1].year + ' and ' + schedule[i].year);
    }
  }
});

test('buildAmortizationSchedule: balance is fully paid off at the end of the loan term', () => {
  const inputs = { price: 350000, downPct: 20, rate: 6.75, termYears: 15 };
  const schedule = Projections.buildAmortizationSchedule(inputs, 15);
  assertClose(schedule[schedule.length - 1].endBalance, 0, 0.5);
});

test('buildAmortizationSchedule: balance stays at 0 when projecting past the loan term', () => {
  const inputs = { price: 350000, downPct: 20, rate: 6.75, termYears: 15 };
  const schedule = Projections.buildAmortizationSchedule(inputs, 20);
  assertClose(schedule[19].endBalance, 0, 0.001);
});

test('projectHold: a 10-year hold produces a positive equity multiple on a cash-flow-positive deal', () => {
  const inputs = {
    price: 350000, downPct: 20, rate: 6.75, termYears: 30, closing: 7000, rehab: 5000,
    rent: 2900, vacancyPct: 5, tax: 4200, insurance: 1600, hoaMonthly: 0, maintPct: 6, mgmtPct: 8, otherMonthly: 0
  };
  const proj = Projections.projectHold(inputs, { holdYears: 10 });
  if (proj.totalReturnMultiple <= 1) {
    throw new Error('expected an equity multiple above 1.0x on a 10-year hold, got ' + proj.totalReturnMultiple);
  }
  if (proj.years.length !== 10) throw new Error('expected 10 years of projection data, got ' + proj.years.length);
});

done();
