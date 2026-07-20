/**
 * app.js — DOM wiring for the Real Estate Deal Analyzer.
 * Depends on Calc, Projections, Insights, Settings, ExportCsv, SAMPLE_LISTINGS,
 * Storage, Share, and (for the projection chart) the global Chart constructor
 * from Chart.js — all loaded as globals before this file.
 */
(function () {
  'use strict';

  function fmt$(n) {
    return (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
  function fmtPct(n) {
    return (n || 0).toFixed(2) + '%';
  }

  let currentDealId = null;
  let currentYearBuilt = null;
  let projectionChart = null;

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tabId));
    if (tabId === 'portfolio') renderPortfolio();
    if (tabId === 'compare') renderCompare();
  }

  const FIELD_IDS = ['price', 'down', 'rate', 'term', 'closing', 'rehab', 'rent', 'vacancy',
                      'tax', 'insurance', 'hoa', 'maint', 'mgmt', 'other'];

  function readInputs() {
    return {
      price: +val('price'), downPct: +val('down'), rate: +val('rate'), termYears: +val('term'),
      closing: +val('closing'), rehab: +val('rehab'), rent: +val('rent'), vacancyPct: +val('vacancy'),
      tax: +val('tax'), insurance: +val('insurance'), hoaMonthly: +val('hoa'),
      maintPct: +val('maint'), mgmtPct: +val('mgmt'), otherMonthly: +val('other')
    };
  }

  function writeInputs(inputs) {
    setVal('price', inputs.price); setVal('down', inputs.downPct); setVal('rate', inputs.rate);
    setVal('term', inputs.termYears); setVal('closing', inputs.closing); setVal('rehab', inputs.rehab);
    setVal('rent', inputs.rent); setVal('vacancy', inputs.vacancyPct); setVal('tax', inputs.tax);
    setVal('insurance', inputs.insurance); setVal('hoa', inputs.hoaMonthly); setVal('maint', inputs.maintPct);
    setVal('mgmt', inputs.mgmtPct); setVal('other', inputs.otherMonthly);
  }

  function val(id) { const el = document.getElementById(id); return el ? (el.value || 0) : 0; }
  function setVal(id, v) { const el = document.getElementById(id); if (el && v !== undefined && v !== null) el.value = v; }

  function renderResults(m) {
    const thresholds = Settings.get();
    const results = document.getElementById('results');
    results.innerHTML = '';
    function addMetric(name, value, cls) {
      const row = document.createElement('div');
      row.className = 'metric' + (cls ? ' ' + cls : '');
      row.innerHTML = '<span class="name">' + name + '</span><span class="val">' + value + '</span>';
      results.appendChild(row);
    }
    addMetric('Loan amount', fmt$(m.loanAmount));
    addMetric('Monthly P&amp;I payment', fmt$(m.monthlyPI));
    addMetric('Effective gross income (annual)', fmt$(m.effectiveGrossIncome));
    addMetric('Total operating expenses (annual)', fmt$(m.totalOperatingExpenses));
    addMetric('Net Operating Income (NOI)', fmt$(m.noi), 'highlight');
    addMetric('Cap rate', fmtPct(m.capRate), m.capRate >= thresholds.capRateTarget ? 'good' : (m.capRate >= thresholds.capRateTarget * 0.65 ? '' : 'bad'));
    addMetric('Monthly cash flow', fmt$(m.monthlyCashFlow), m.monthlyCashFlow >= 0 ? 'good' : 'bad');
    addMetric('Annual cash flow', fmt$(m.annualCashFlow), m.annualCashFlow >= 0 ? 'good' : 'bad');
    addMetric('Total cash invested', fmt$(m.totalCashInvested));
    addMetric('Cash-on-cash return', fmtPct(m.cashOnCash), m.cashOnCash >= thresholds.cocTarget ? 'good' : (m.cashOnCash >= 0 ? '' : 'bad'));
    addMetric('DSCR', m.dscr.toFixed(2) + 'x', m.dscr >= thresholds.dscrTarget ? 'good' : (m.dscr >= 1 ? '' : 'bad'));

    const verdict = document.getElementById('verdict');
    let vClass = 'mid', vText = '';
    if (m.cashOnCash >= thresholds.cocTarget && m.dscr >= thresholds.dscrTarget && m.monthlyCashFlow >= 0) {
      vClass = 'good';
      vText = 'Strong on paper: positive cash flow, healthy debt coverage, and a cash-on-cash return at or above your ' + thresholds.cocTarget + '% target.';
    } else if (m.monthlyCashFlow < 0 || m.dscr < 1) {
      vClass = 'bad';
      vText = "Caution: the deal is running negative monthly cash flow and/or the NOI doesn't comfortably cover debt service. Revisit purchase price, financing terms, or rent assumptions.";
    } else {
      vClass = 'mid';
      vText = 'Middling: cash flow is positive but returns are modest relative to your screening targets. Worth comparing against other deals before committing.';
    }
    verdict.className = 'verdict ' + vClass;
    verdict.textContent = vText;
  }

  function renderInsights(inputs, metrics) {
    const container = document.getElementById('insights-list');
    container.innerHTML = '';
    const thresholds = Settings.get();
    const deals = Storage.getAll();
    let portfolioAvgCapRate;
    if (deals.length) {
      const sum = deals.reduce((s, d) => s + Calc.computeMetrics(d.inputs).capRate, 0);
      portfolioAvgCapRate = sum / deals.length;
    }
    const items = Insights.generate(inputs, metrics, thresholds, { yearBuilt: currentYearBuilt, portfolioAvgCapRate });
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'insight-item ' + item.level;
      div.textContent = item.text;
      container.appendChild(div);
    });
  }

  function renderScenarios(inputs) {
    const thresholds = Settings.get();
    const scenarios = [
      { key: 'downside', label: 'Downside' },
      { key: 'base', label: 'Base Case' },
      { key: 'upside', label: 'Upside' }
    ];
    const rows = [
      { label: 'Monthly cash flow', get: m => fmt$(m.monthlyCashFlow), good: m => m.monthlyCashFlow >= 0 },
      { label: 'Cap rate', get: m => fmtPct(m.capRate), good: m => m.capRate >= thresholds.capRateTarget },
      { label: 'Cash-on-cash return', get: m => fmtPct(m.cashOnCash), good: m => m.cashOnCash >= thresholds.cocTarget },
      { label: 'DSCR', get: m => m.dscr.toFixed(2) + 'x', good: m => m.dscr >= thresholds.dscrTarget }
    ];
    const computed = scenarios.map(s => ({ ...s, m: Calc.computeMetrics(s.key === 'base' ? inputs : Calc.applyScenario(inputs, s.key)) }));

    let html = '<thead><tr><th>Metric</th>';
    computed.forEach(s => { html += '<th class="' + (s.key === 'base' ? 'col-base' : '') + '">' + s.label + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(r => {
      html += '<tr><td>' + r.label + '</td>';
      computed.forEach(s => {
        const cls = (s.key === 'base' ? 'col-base ' : '') + (r.good(s.m) ? 'good' : 'bad');
        html += '<td class="' + cls + '">' + r.get(s.m) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody>';
    document.getElementById('scenario-table').innerHTML = html;

    document.getElementById('scenario-legend').innerHTML =
      '<span>Cap rate target: ≥' + thresholds.capRateTarget + '%</span>' +
      '<span>Cash-on-cash target: ≥' + thresholds.cocTarget + '%</span>' +
      '<span>DSCR target: ≥' + thresholds.dscrTarget + 'x</span>';
  }

  function readProjectionOptions() {
    return {
      holdYears: Math.max(1, +document.getElementById('proj-hold-years').value || 10),
      appreciationPct: +document.getElementById('proj-appreciation').value,
      rentGrowthPct: +document.getElementById('proj-rent-growth').value,
      expenseGrowthPct: +document.getElementById('proj-expense-growth').value,
      sellingCostPct: +document.getElementById('proj-selling-cost').value
    };
  }

  function renderProjection() {
    const inputs = readInputs();
    const options = readProjectionOptions();
    const proj = Projections.projectHold(inputs, options);

    const summary = document.getElementById('projection-summary');
    summary.innerHTML = '';
    function addStat(name, value, cls) {
      const el = document.createElement('div');
      el.className = 'metric' + (cls ? ' ' + cls : '');
      el.innerHTML = '<span class="name">' + name + '</span><span class="val">' + value + '</span>';
      summary.appendChild(el);
    }
    addStat('Projected IRR', proj.irr !== null ? fmtPct(proj.irr * 100) : 'n/a (no solvable rate)', proj.irr !== null && proj.irr >= 0.10 ? 'good' : '');
    addStat('Equity multiple at exit', proj.totalReturnMultiple.toFixed(2) + 'x');
    addStat('Total profit at exit', fmt$(proj.totalProfit), proj.totalProfit >= 0 ? 'good' : 'bad');
    addStat('Net sale proceeds (yr ' + options.holdYears + ')', fmt$(proj.netSaleProceeds));

    if (typeof Chart === 'undefined') return;

    const labels = proj.years.map(y => 'Yr ' + y.year);
    const propertyValues = proj.years.map(y => Math.round(y.propertyValue));
    const loanBalances = proj.years.map(y => Math.round(y.loanBalance));
    const equities = proj.years.map(y => Math.round(y.equity));
    const cumCashFlows = proj.years.map(y => Math.round(y.cumulativeCashFlow));

    const canvas = document.getElementById('projection-chart');
    const ctx = canvas.getContext('2d');
    if (projectionChart) projectionChart.destroy();
    projectionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Property Value', data: propertyValues, borderColor: '#16A34A', backgroundColor: 'transparent', yAxisID: 'y', tension: 0.15 },
          { label: 'Loan Balance', data: loanBalances, borderColor: '#DC2626', backgroundColor: 'transparent', yAxisID: 'y', tension: 0.15 },
          { label: 'Equity', data: equities, borderColor: '#4F46E5', backgroundColor: 'transparent', yAxisID: 'y', tension: 0.15 },
          { label: 'Cumulative Cash Flow', data: cumCashFlows, borderColor: '#64748B', backgroundColor: 'transparent', yAxisID: 'y1', borderDash: [4, 3], tension: 0.15 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { position: 'left', ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' } }
        },
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });
  }

  function calc() {
    const inputs = readInputs();
    const base = Calc.computeMetrics(inputs);
    renderResults(base);
    renderInsights(inputs, base);
    renderScenarios(inputs);
    renderProjection();
    document.getElementById('share-box').classList.remove('visible');
  }

  function initCalculatorForm() {
    FIELD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', calc);
    });
    ['proj-hold-years', 'proj-appreciation', 'proj-rent-growth', 'proj-expense-growth', 'proj-selling-cost'].forEach(id => {
      document.getElementById(id).addEventListener('input', renderProjection);
    });
  }

  function initSettings() {
    const toggle = document.getElementById('settings-toggle');
    const box = document.getElementById('settings-box');
    const s = Settings.get();
    setVal('setting-cap-rate', s.capRateTarget);
    setVal('setting-coc', s.cocTarget);
    setVal('setting-dscr', s.dscrTarget);

    toggle.addEventListener('click', () => {
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('save-settings').addEventListener('click', () => {
      Settings.save({
        capRateTarget: +val('setting-cap-rate') || Settings.DEFAULTS.capRateTarget,
        cocTarget: +val('setting-coc') || Settings.DEFAULTS.cocTarget,
        dscrTarget: +val('setting-dscr') || Settings.DEFAULTS.dscrTarget
      });
      calc();
      showToast('Screening thresholds updated');
    });

    document.getElementById('reset-settings').addEventListener('click', () => {
      const d = Settings.reset();
      setVal('setting-cap-rate', d.capRateTarget);
      setVal('setting-coc', d.cocTarget);
      setVal('setting-dscr', d.dscrTarget);
      calc();
      showToast('Reset to default thresholds');
    });
  }

  function initActions() {
    document.getElementById('save-deal').addEventListener('click', () => {
      const nickname = document.getElementById('nickname').value.trim() || 'Untitled Deal';
      const inputs = readInputs();
      currentDealId = Storage.save({ id: currentDealId, nickname, inputs });
      showToast('Deal saved to your portfolio');
    });

    document.getElementById('share-link').addEventListener('click', () => {
      const inputs = readInputs();
      const url = Share.buildShareUrl(inputs);
      const box = document.getElementById('share-box');
      box.textContent = url;
      box.classList.add('visible');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => showToast('Share link copied to clipboard'))
          .catch(() => showToast('Share link ready below'));
      } else {
        showToast('Share link ready below');
      }
    });

    document.getElementById('export-print').addEventListener('click', () => {
      window.print();
    });
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function initSearch() {
    const cityFilter = document.getElementById('filter-city');
    const cities = Array.from(new Set(SAMPLE_LISTINGS.map(l => l.city))).sort();
    cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      cityFilter.appendChild(opt);
    });

    ['filter-max-price', 'filter-min-beds', 'filter-city'].forEach(id => {
      document.getElementById(id).addEventListener('input', renderListings);
    });
    renderListings();
  }

  function renderListings() {
    const maxPrice = +document.getElementById('filter-max-price').value || Infinity;
    const minBeds = +document.getElementById('filter-min-beds').value || 0;
    const city = document.getElementById('filter-city').value;

    const filtered = SAMPLE_LISTINGS.filter(l =>
      l.price <= maxPrice && l.beds >= minBeds && (!city || l.city === city)
    );

    const grid = document.getElementById('listing-grid');
    grid.innerHTML = '';
    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-state">No sample listings match those filters. Try widening your search.</div>';
      return;
    }
    filtered.forEach(l => {
      const card = document.createElement('div');
      card.className = 'listing-card';
      card.innerHTML =
        '<div class="price">' + fmt$(l.price) + '</div>' +
        '<div class="addr">' + l.address + '</div>' +
        '<div class="city">' + l.city + ', ' + l.state + '</div>' +
        '<div class="stats">' + l.beds + ' bd &middot; ' + l.baths + ' ba &middot; ' + l.sqft.toLocaleString() + ' sqft &middot; built ' + l.yearBuilt + '</div>' +
        '<div class="rent-est">Est. rent: ' + fmt$(l.estRent) + '/mo</div>' +
        '<button class="btn analyze-btn" data-id="' + l.id + '">Analyze This Deal</button>';
      grid.appendChild(card);
    });

    grid.querySelectorAll('.analyze-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const listing = SAMPLE_LISTINGS.find(l => l.id === btn.dataset.id);
        applyListingToCalculator(listing);
      });
    });
  }

  function applyListingToCalculator(listing) {
    const current = readInputs();
    writeInputs({
      ...current,
      price: listing.price,
      rent: listing.estRent,
      tax: listing.tax,
      insurance: listing.insurance,
      hoaMonthly: listing.hoa
    });
    document.getElementById('nickname').value = listing.address + ', ' + listing.city;
    currentDealId = null;
    currentYearBuilt = listing.yearBuilt || null;
    calc();
    switchTab('calculator');
    showToast('Loaded ' + listing.address + ' into the calculator');
  }

  const selectedForCompare = new Set();

  function renderPortfolio() {
    const thresholds = Settings.get();
    const deals = Storage.getAll();
    const summary = Calc.summarizePortfolio(deals);

    document.getElementById('summary-count').textContent = summary.count;
    document.getElementById('summary-cashflow').textContent = fmt$(summary.totalMonthlyCashFlow);
    document.getElementById('summary-caprate').textContent = fmtPct(summary.blendedCapRate);
    document.getElementById('summary-coc').textContent = fmtPct(summary.blendedCashOnCash);

    const tbody = document.getElementById('portfolio-tbody');
    tbody.innerHTML = '';

    if (!deals.length) {
      document.getElementById('portfolio-empty').style.display = 'block';
      document.getElementById('portfolio-table-wrap').style.display = 'none';
      document.getElementById('portfolio-actions').style.display = 'none';
      return;
    }
    document.getElementById('portfolio-empty').style.display = 'none';
    document.getElementById('portfolio-table-wrap').style.display = 'block';
    document.getElementById('portfolio-actions').style.display = 'flex';

    deals.forEach(d => {
      const m = Calc.computeMetrics(d.inputs);
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="checkbox-cell"><input type="checkbox" class="compare-check" data-id="' + d.id + '" ' + (selectedForCompare.has(d.id) ? 'checked' : '') + '></td>' +
        '<td style="text-align:left">' + escapeHtml(d.nickname) + '</td>' +
        '<td>' + fmt$(d.inputs.price) + '</td>' +
        '<td class="' + (m.monthlyCashFlow >= 0 ? 'good' : 'bad') + '">' + fmt$(m.monthlyCashFlow) + '</td>' +
        '<td class="' + (m.capRate >= thresholds.capRateTarget ? 'good' : '') + '">' + fmtPct(m.capRate) + '</td>' +
        '<td class="' + (m.cashOnCash >= thresholds.cocTarget ? 'good' : '') + '">' + fmtPct(m.cashOnCash) + '</td>' +
        '<td class="' + (m.dscr >= thresholds.dscrTarget ? 'good' : (m.dscr < 1 ? 'bad' : '')) + '">' + m.dscr.toFixed(2) + 'x</td>' +
        '<td><div class="deal-row-actions">' +
          '<button class="btn secondary load-btn" data-id="' + d.id + '">Load</button>' +
          '<button class="btn danger delete-btn" data-id="' + d.id + '">Delete</button>' +
        '</div></td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.load-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const deal = Storage.get(btn.dataset.id);
        if (!deal) return;
        writeInputs(deal.inputs);
        document.getElementById('nickname').value = deal.nickname;
        currentDealId = deal.id;
        currentYearBuilt = null;
        calc();
        switchTab('calculator');
      });
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.remove(btn.dataset.id);
        selectedForCompare.delete(btn.dataset.id);
        if (currentDealId === btn.dataset.id) currentDealId = null;
        renderPortfolio();
        showToast('Deal removed');
      });
    });
    tbody.querySelectorAll('.compare-check').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (selectedForCompare.size >= 3) {
            cb.checked = false;
            showToast('You can compare up to 3 deals at a time');
            return;
          }
          selectedForCompare.add(cb.dataset.id);
        } else {
          selectedForCompare.delete(cb.dataset.id);
        }
      });
    });
  }

  function initPortfolioActions() {
    document.getElementById('export-csv').addEventListener('click', () => {
      const deals = Storage.getAll();
      if (!deals.length) { showToast('No saved deals to export'); return; }
      ExportCsv.download(deals, 'portfolio.csv');
      showToast('Portfolio exported as CSV');
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function renderCompare() {
    const thresholds = Settings.get();
    const wrap = document.getElementById('compare-content');
    const ids = Array.from(selectedForCompare);
    const deals = ids.map(id => Storage.get(id)).filter(Boolean);

    if (deals.length < 2) {
      wrap.innerHTML = '<div class="empty-state">Select 2-3 saved deals from the Portfolio tab (checkbox on the left of each row) to compare them side by side.</div>';
      return;
    }

    const rows = [
      { label: 'Purchase price', get: (d, m) => fmt$(d.inputs.price) },
      { label: 'Monthly cash flow', get: (d, m) => fmt$(m.monthlyCashFlow), good: m => m.monthlyCashFlow >= 0 },
      { label: 'Cap rate', get: (d, m) => fmtPct(m.capRate), good: m => m.capRate >= thresholds.capRateTarget },
      { label: 'Cash-on-cash return', get: (d, m) => fmtPct(m.cashOnCash), good: m => m.cashOnCash >= thresholds.cocTarget },
      { label: 'DSCR', get: (d, m) => m.dscr.toFixed(2) + 'x', good: m => m.dscr >= thresholds.dscrTarget },
      { label: 'Total cash invested', get: (d, m) => fmt$(m.totalCashInvested) },
      { label: 'NOI (annual)', get: (d, m) => fmt$(m.noi) }
    ];

    const computed = deals.map(d => ({ d, m: Calc.computeMetrics(d.inputs) }));

    let html = '<table class="data-table"><thead><tr><th>Metric</th>';
    computed.forEach(c => { html += '<th>' + escapeHtml(c.d.nickname) + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(r => {
      html += '<tr><td>' + r.label + '</td>';
      computed.forEach(c => {
        const cls = r.good ? (r.good(c.m) ? 'good' : 'bad') : '';
        html += '<td class="' + cls + '">' + r.get(c.d, c.m) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function initRentEstimator() {
    const toggle = document.getElementById('rent-helper-toggle');
    const box = document.getElementById('rent-helper-box');
    toggle.addEventListener('click', () => {
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('use-one-percent').addEventListener('click', () => {
      const price = +val('price');
      const pct = +document.getElementById('one-percent-pct').value || 1.0;
      const est = Calc.estimateRentOnePercent(price, pct);
      setVal('rent', Math.round(est));
      calc();
      showToast('Rent set from rule-of-thumb estimate');
    });

    document.getElementById('use-comps').addEventListener('click', () => {
      const comps = [
        document.getElementById('comp1').value,
        document.getElementById('comp2').value,
        document.getElementById('comp3').value
      ];
      const est = Calc.estimateRentFromComps(comps);
      if (est > 0) {
        setVal('rent', Math.round(est));
        calc();
        showToast('Rent set from comps average');
      }
    });
  }

  function init() {
    initTabs();
    initSettings();
    initCalculatorForm();
    initRentEstimator();
    initActions();
    initSearch();
    initPortfolioActions();

    const shared = Share.readFromHash();
    if (shared) {
      writeInputs(shared);
      document.getElementById('nickname').value = 'Shared Deal';
      currentDealId = null;
      currentYearBuilt = null;
    }
    calc();

    if (shared) switchTab('calculator');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
