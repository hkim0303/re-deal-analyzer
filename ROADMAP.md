# Roadmap

Status legend: **Shipped** = live in this repo today. **Dream** = intentionally not built — either requires paid/licensed infrastructure not available for a personal project, or is a larger investment than a portfolio piece warrants. Listed here so scope is explicit, not implied.

## Shipped (v1–v3)

- Deal calculator: amortization, NOI, cap rate, cash flow, cash-on-cash, DSCR
- Downside / base / upside scenario analysis
- Rule-of-thumb rent estimator (1% rule + comps average)
- Sample property search with filters (price, beds, city)
- Portfolio dashboard: save deals, blended cash flow / cap rate / cash-on-cash across all saved deals, CSV export
- Compare up to 3 saved deals side by side
- Shareable links (deal state encoded in the URL, no backend)
- Print / export to PDF via the browser
- Long-term hold projection: IRR (bisection method), equity multiple, total profit, net sale proceeds, with a Chart.js equity/cash-flow visualization
- Rule-based Deal Insights panel (explicitly not AI/ML — labeled as heuristics in the UI)
- Configurable screening thresholds (cap rate / cash-on-cash / DSCR targets), persisted per-browser

## Dream / Future (not built)

These are the features a real investor would eventually want. Each one is a deliberate scope cut, not an oversight:

- **Live MLS / data-provider integration** (RentCast, ATTOM, Zillow data licensing, or broker MLS access) to replace the sample listings with real, current inventory. Requires a paid data agreement.
- **Automated Valuation Model (AVM)** — estimate a property's fair value from comps using a real pricing model, not just rule-of-thumb rent estimation. Would need a licensed data feed plus a real modeling effort, not a weekend feature.
- **User accounts + cloud sync** — right now saved deals live in browser `localStorage`, so they don't follow you across devices. Real accounts mean auth, a database, and a backend — a genuine infrastructure investment, not a static-site feature.
- **Mobile app** — the current site is responsive but is not a native app.
- **Deal alerts / notifications** — e.g. "notify me when a listing matching my criteria hits the market" requires a backend, a scheduler, and a real data feed.
- **Lender / partner collaboration** — shared workspaces, comments, permissions on a deal. This is the same "permissions-aware collaborative workflow" problem I've solved professionally in enterprise SaaS — a natural extension, just out of scope for v1.
- **Market trend charts** — rent growth, appreciation, and comp trends over time, likely sourced from public data (FRED, Census) rather than paid feeds, layered on top of individual deal analysis.
- **QuickBooks / accounting integration** — sync actual portfolio performance (not just underwriting projections) with real bookkeeping.

## Near-term, realistic next steps

Smaller items that don't require new infrastructure:

- Editable/persisted comps library (so rent comps don't need to be re-entered per deal)
- Multi-unit / multifamily support (currently modeled as a single rent line)
- Excel (.xlsx) export alongside the existing CSV export
