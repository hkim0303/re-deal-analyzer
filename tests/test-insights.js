const { createRunner } = require('./helpers');
const Insights = require('../js/insights.js');
const { test, done } = createRunner('test-insights.js');

const thresholds = { capRateTarget: 6, cocTarget: 8, dscrTarget: 1.25 };

function hasLevel(items, level) {
  return items.some(i => i.level === level);
}

test('flags a thin maintenance assumption on an older property as a warning', () => {
  const items = Insights.generate(
    { maintPct: 4, vacancyPct: 5, mgmtPct: 8, closing: 7000, price: 350000 },
    { dscr: 1.3, cashOnCash: 8, capRate: 6 },
    thresholds,
    { yearBuilt: 1975 }
  );
  if (!hasLevel(items, 'warning')) throw new Error('expected a warning for an old property with thin maintenance');
});

test('flags an aggressive vacancy assumption as a warning', () => {
  const items = Insights.generate(
    { maintPct: 6, vacancyPct: 2, mgmtPct: 8, closing: 7000, price: 350000 },
    { dscr: 1.3, cashOnCash: 8, capRate: 6 },
    thresholds,
    {}
  );
  if (!hasLevel(items, 'warning')) throw new Error('expected a warning for an aggressive vacancy assumption');
});

test('flags DSCR below 1.0x as a warning', () => {
  const items = Insights.generate(
    { maintPct: 6, vacancyPct: 5, mgmtPct: 8, closing: 7000, price: 350000 },
    { dscr: 0.9, cashOnCash: 8, capRate: 6 },
    thresholds,
    {}
  );
  if (!hasLevel(items, 'warning')) throw new Error('expected a warning for DSCR below 1.0x');
});

test('flags no property management cost as informational', () => {
  const items = Insights.generate(
    { maintPct: 6, vacancyPct: 5, mgmtPct: 0, closing: 7000, price: 350000 },
    { dscr: 1.3, cashOnCash: 8, capRate: 6 },
    thresholds,
    {}
  );
  if (!hasLevel(items, 'info')) throw new Error('expected an info-level insight when management cost is 0');
});

test('flags a strong deal that clears all three targets as positive', () => {
  const items = Insights.generate(
    { maintPct: 8, vacancyPct: 6, mgmtPct: 8, closing: 7000, price: 350000 },
    { dscr: 1.5, cashOnCash: 14, capRate: 7 },
    thresholds,
    {}
  );
  if (!hasLevel(items, 'positive')) throw new Error('expected a positive insight when cap rate, cash-on-cash, and DSCR all clear target');
});

test('falls back to a single positive message when no rule triggers', () => {
  const items = Insights.generate(
    { maintPct: 8, vacancyPct: 6, mgmtPct: 8, closing: 7000, price: 350000 },
    { dscr: 1.3, cashOnCash: 9, capRate: 5 },
    thresholds,
    {}
  );
  if (items.length !== 1) throw new Error('expected exactly one fallback insight, got ' + items.length);
  if (items[0].level !== 'positive') throw new Error('expected the fallback insight to be positive, got ' + items[0].level);
});

done();
