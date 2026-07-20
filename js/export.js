/**
 * export.js
 * Exports the saved-deals portfolio to a CSV file the browser downloads
 * directly — no backend involved. Depends on Calc.computeMetrics.
 */
const ExportCsv = (function () {
  function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const s = String(value);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCsv(deals) {
    const headers = [
      'Nickname', 'Price', 'Down %', 'Rate %', 'Monthly Rent',
      'Monthly Cash Flow', 'Annual Cash Flow', 'Cap Rate %', 'Cash-on-Cash %',
      'DSCR', 'Total Cash Invested', 'Saved At'
    ];
    const rows = deals.map(d => {
      const m = Calc.computeMetrics(d.inputs);
      return [
        csvEscape(d.nickname),
        d.inputs.price,
        d.inputs.downPct,
        d.inputs.rate,
        d.inputs.rent,
        m.monthlyCashFlow.toFixed(2),
        m.annualCashFlow.toFixed(2),
        m.capRate.toFixed(2),
        m.cashOnCash.toFixed(2),
        m.dscr.toFixed(2),
        m.totalCashInvested.toFixed(2),
        d.savedAt || ''
      ].join(',');
    });
    return headers.join(',') + '\n' + rows.join('\n');
  }

  function download(deals, filename) {
    const csv = toCsv(deals);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'portfolio.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { toCsv, download, csvEscape };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportCsv;
}
