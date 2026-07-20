/**
 * insights.js
 *
 * Rule-based checks against common underwriting benchmarks — explicitly NOT
 * machine learning or AI. It's a small set of if/then heuristics a human
 * underwriter would also apply, surfaced automatically so they're not missed.
 * Labeled as "rule-based" in the UI on purpose: don't oversell this.
 */
const Insights = (function () {
  function generate(inputs, metrics, thresholds, context) {
    context = context || {};
    thresholds = thresholds || { capRateTarget: 6, cocTarget: 8, dscrTarget: 1.25 };
    const items = [];
    function add(level, text) { items.push({ level, text }); }

    if (context.yearBuilt && inputs.maintPct < 5 && context.yearBuilt < 1990) {
      add('warning', 'Maintenance assumption (' + inputs.maintPct + '% of rent) looks low for a property built in ' +
        context.yearBuilt + '. Older properties often run 8-10%+ in upkeep.');
    } else if (inputs.maintPct < 4) {
      add('warning', 'Maintenance assumption (' + inputs.maintPct + '% of rent) is on the low side; most underwriting models use 5-10%.');
    }

    if (inputs.vacancyPct < 3) {
      add('warning', 'Vacancy assumption (' + inputs.vacancyPct + '%) is aggressive. Most markets budget 5-8% even in strong rental demand.');
    }

    if (metrics.dscr < 1.0) {
      add('warning', 'DSCR is below 1.0x (' + metrics.dscr.toFixed(2) + 'x) — net operating income does not fully cover debt service.');
    } else if (metrics.dscr < thresholds.dscrTarget) {
      add('info', 'DSCR (' + metrics.dscr.toFixed(2) + 'x) is below your ' + thresholds.dscrTarget + 'x target, though it still covers debt service.');
    }

    if (inputs.mgmtPct === 0) {
      add('info', 'No property management cost included. If this will be self-managed, factor in your own time — third-party management typically runs 8-10% of rent.');
    }

    if (inputs.closing < inputs.price * 0.01) {
      add('info', 'Closing costs look low relative to the typical 1-3% of purchase price. Confirm title, inspection, and lender fees are all included.');
    }

    if (metrics.cashOnCash >= thresholds.cocTarget * 1.5 && metrics.cashOnCash > 0) {
      add('positive', 'Cash-on-cash return (' + metrics.cashOnCash.toFixed(1) + '%) is well above your ' + thresholds.cocTarget + '% target.');
    }

    if (metrics.capRate >= thresholds.capRateTarget && metrics.cashOnCash >= thresholds.cocTarget && metrics.dscr >= thresholds.dscrTarget) {
      add('positive', 'Clears all three screening targets (cap rate, cash-on-cash, DSCR) at once — worth prioritizing for deeper diligence.');
    }

    if (typeof context.portfolioAvgCapRate === 'number') {
      const diff = metrics.capRate - context.portfolioAvgCapRate;
      if (Math.abs(diff) >= 0.5) {
        add('info', 'Cap rate is ' + Math.abs(diff).toFixed(1) + ' points ' + (diff > 0 ? 'above' : 'below') +
          ' the average of your saved deals (' + context.portfolioAvgCapRate.toFixed(1) + '%).');
      }
    }

    if (!items.length) {
      add('positive', 'No flags from a quick rule-based check — assumptions look within typical ranges.');
    }

    return items;
  }

  return { generate };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Insights;
}
