const { createRunner } = require('./helpers');
const Calc = require('../js/calc.js');
global.Calc = Calc; // export.js expects Calc as a global, same as it does in the browser
const ExportCsv = require('../js/export.js');
const { test, done } = createRunner('test-export.js');

const sampleDeals = [
  {
    nickname: 'Test Deal, with a comma',
    inputs: {
      price: 350000, downPct: 20, rate: 6.75, termYears: 30, closing: 7000, rehab: 5000,
      rent: 2900, vacancyPct: 5, tax: 4200, insurance: 1600, hoaMonthly: 0, maintPct: 6, mgmtPct: 8, otherMonthly: 0
    },
    savedAt: '2026-01-01T00:00:00.000Z'
  }
];

test('csvEscape: wraps and escapes values containing commas or quotes', () => {
  const escaped = ExportCsv.csvEscape('Value, with "quotes"');
  if (escaped !== '"Value, with ""quotes"""') {
    throw new Error('unexpected CSV escaping: ' + escaped);
  }
});

test('toCsv: header row matches the expected column order', () => {
  const csv = ExportCsv.toCsv(sampleDeals);
  const header = csv.split('\n')[0];
  if (!header.startsWith('Nickname,Price,Down %,Rate %')) {
    throw new Error('unexpected CSV header: ' + header);
  }
});

test('toCsv: quotes a nickname that contains a comma', () => {
  const csv = ExportCsv.toCsv(sampleDeals);
  if (!csv.includes('"Test Deal, with a comma"')) {
    throw new Error('expected the nickname to be quoted in the CSV output');
  }
});

test('toCsv: produces one data row per deal', () => {
  const csv = ExportCsv.toCsv(sampleDeals);
  const lines = csv.trim().split('\n');
  if (lines.length !== 2) throw new Error('expected a header row plus 1 data row, got ' + lines.length + ' lines');
});

done();
