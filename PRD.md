# Product Requirements & Decisions — Real Estate Deal Analyzer

This doc captures the product thinking behind this project, not just the code. It's here for the same reason a PRD normally exists: so the "why" survives past the person who wrote it.

**Author:** Heewon Kim, Product Manager
**Status:** Shipped (v1 → v3), maintained as a personal project

---

## 1. Problem statement

Personal real estate investing decisions — "should I buy this property?" — get made against fragmented, inconsistent information: a mortgage payment from one calculator, a cap rate estimate from a blog post, a gut-check on rent from Zillow. There's no single, fast, honest place to run the numbers, stress-test them, and compare deals side by side.

Separately, I needed a way to demonstrate product and technical judgment in a domain (real estate/finance) where I don't have professional experience, without overstating what I know. A generic "practice project" wouldn't do that — it needed to be scoped and built with the same discipline I'd apply to a real roadmap.

## 2. Target user

**Primary persona: the self-directed small-scale investor.** Someone evaluating 1-4 unit rental properties on their own, comfortable with basic real estate math (cap rate, cash-on-cash return) but currently doing it in scattered spreadsheets or one-off calculators. Not a persona sourced from user interviews — this project didn't have a user research budget — but grounded in how rental property underwriting actually works, mapped from public real estate investing methodology (cap rate, DSCR, cash-on-cash return, 1% rule) rather than assumption.

**Explicitly not the target user:** institutional/fund-level acquisitions (different data needs, different scale), or anyone needing live MLS data (see Non-Goals).

## 3. Goals

- Let a user go from "here's a property" to "here's whether it pencils out" in under a minute
- Make the underwriting math transparent — show the formula, not just the output
- Support comparing multiple deals, not just evaluating one in isolation
- Be honest everywhere the product could be tempted to oversell itself

## 4. Non-goals (v1–v3)

- **Live MLS / property data integration.** Requires a licensed data feed (RentCast, ATTOM, broker MLS access) that isn't available for a personal project. Property Search uses clearly-labeled sample listings instead of pretending to be connected to real inventory.
- **AI/ML-based recommendations.** The "Deal Insights" panel is rule-based (if/then heuristics against underwriting benchmarks) and labeled as such in the UI. It would have been easy to call this "AI-powered" — deliberately didn't, because it isn't.
- **Accounts, cloud sync, multi-device support.** Everything is client-side (localStorage). No backend means no server costs, no auth to build, and no user data to be responsible for securing — an explicit scope cut, not an oversight. Tracked in ROADMAP.md as a future direction if this ever needed multi-device use.
- **Automated Valuation Model (AVM) / property value estimates.** Rent and value inputs are either user-supplied or a labeled rule-of-thumb (1% rule), never presented as an appraisal.

## 5. What shipped, by version

| Version | Scope |
|---|---|
| v1 | Single-page calculator: cash flow, cap rate, cash-on-cash, DSCR, downside/upside scenario stress-test |
| v2 | Restructured into a multi-file product: Property Search (sample data), Portfolio dashboard (save/load/delete deals), Compare (2-3 deals side by side), rent estimator, shareable deal links (URL-encoded, no backend), print/PDF export |
| v3 | Long-term hold projection (IRR, equity multiple, amortization-driven equity chart), rule-based Deal Insights panel, configurable screening thresholds (cap rate/cash-on-cash/DSCR targets), CSV portfolio export |

Full feature-level detail: [README.md](./README.md). Forward-looking scope: [ROADMAP.md](./ROADMAP.md).

## 6. Key product decisions & tradeoffs

**Client-side-only architecture, no backend.**
Tradeoff: no cross-device sync, no accounts. Chosen because it matches the actual constraint (a static GitHub Pages site, no server budget) and because it removes an entire category of risk — there's no user data sitting on a server to secure or leak. If this were a real product with real users asking for multi-device access, this is the first assumption I'd revisit.

**Sample data instead of live MLS, clearly labeled.**
Tradeoff: Property Search isn't "real." Chosen over two worse options: (a) quietly using demo data without disclosure, which misrepresents the product, or (b) not building the feature at all, which would understate what the product could do once wired to a real feed. The labeling is the point — it lets the feature demonstrate the *workflow* (filter, browse, analyze) honestly while being explicit about what's fake.

**Rule-based Deal Insights, not "AI."**
Tradeoff: less impressive-sounding than an AI/ML pitch. Chosen because the underlying logic actually is a small set of if/then checks against underwriting benchmarks (low maintenance assumption for an older property, aggressive vacancy assumption, DSCR below 1.0x, etc.) — calling that AI would be a mischaracterization, and I'd rather the product be smaller and honest than bigger and misleading.

**Bisection-method IRR calculation instead of a canned financial library.**
Tradeoff: more code to write and test myself. Chosen for numerical stability with irregular cash flow series (a large negative outflow at year 0, small positive flows, then a large terminal value at sale) where Newton-Raphson can fail to converge. Verified against known-answer cases (e.g., a lump-sum-only series that should resolve to exactly 10.000% IRR) before trusting it anywhere in the UI.

**Configurable thresholds instead of hardcoded "good deal" logic.**
Tradeoff: more UI surface area (a settings panel) for a small feature. Chosen because "good cap rate" is market- and strategy-dependent — hardcoding 6%/8%/1.25x as universal truth would have been a worse product decision than giving the user control, even though it was the simpler thing to ship first (and was, in v1/v2).

## 7. Success criteria

This is a personal project without a live user base, so "success" isn't measured in adoption metrics — it's measured against the goals in Section 3:

- Can a user run a full underwriting analysis, including a 10-year hold projection, in under a minute from landing on the page? (Yes, verified manually.)
- Does every claim the product makes about itself hold up under scrutiny — no inflated "AI," no fake live data? (Yes — this was checked deliberately at each version, not left implicit.)
- Is the underlying math correct? (Verified with 80+ automated assertions across calculation, projection, and IRR modules, including known-answer financial checks, before any UI work shipped on top of it.)

## 8. Out of scope / where this goes next

See [ROADMAP.md](./ROADMAP.md) for the full list. The short version: live data integration, an AVM, accounts/cloud sync, and a mobile app are all real possibilities if this ever needed to support actual users beyond me — none of them were pursued here because the effort would have gone toward infrastructure rather than product judgment, which was the actual point of building this.
