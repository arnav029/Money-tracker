# Money Management App — Project Plan

## The problem you're solving
Existing expense trackers fail in one of three ways: they're paywalled, they're stuffed with ads, or the UI is clunky enough that people stop opening them within a week. Your wedge isn't a new feature — it's **not being annoying**. Free, no ads, and an interface fast enough that logging an expense takes under 5 seconds.

## Core principle: "5-second log"
Every design and technical decision should be judged against one question: *does this make it faster or slower to log an expense?* If a feature adds friction to that core action, it doesn't belong on the main screen.

---

## Phase 1 — MVP (build this first)

**The one job it does well:** add an expense, tag it with a category, see where your money went.

- **Add expense**: amount, category, optional note, date (defaults to today) — 1 screen, no modal stacking
- **Categories**: a small starter set (Food, Transport, Bills, Shopping, Entertainment, Other) with the ability to add custom ones
- **Home view**: this month's total + a simple breakdown by category (bar or donut), plus a scrollable recent-transactions list
- **Local-first data**: works fully offline, no forced signup to try it

Deliberately **cut** from v1: budgets/limits, recurring transactions, multi-currency, bank sync. These are v2+ — adding them now is how "simple and fast" apps die.

## Phase 2 — Retention features
- Budgets per category with a soft visual warning (not a nagging notification) as you approach the limit
- Weekly/monthly recap — a single glanceable card, not a report
- Quick-add shortcuts (repeat last expense, common amounts)
- Search/filter transactions

## Phase 3 — PR-driven / open-source features
Once the core is solid and you have real users, open the repo for community contributions:
- Publish a clear `CONTRIBUTING.md` and a "good first issue" backlog (new category icons, CSV export, themes)
- This works best *after* the core UX is opinionated and finished — an early-stage open codebase without a strong design direction tends to accumulate inconsistent PRs

---

## Tech approach: Progressive Web App (PWA)

- **Frontend**: React (or Next.js) + Tailwind for styling
- **Install experience**: manifest.json + service worker → "Add to Home Screen," full-screen app-like feel, works offline
- **Storage**: local-first (IndexedDB) for speed and offline use; add optional cloud sync later if you want cross-device
- **Deploy**: Vercel or Netlify — push to a URL, no app store review needed for v1

This gets you 90% of "feels like a real app" with none of the app-store overhead. Wrap it with Capacitor later if you want an actual App Store / Play Store listing.

---

## UI/UX direction

- **Speed over polish, at first**: the add-expense flow should need the fewest taps possible — this matters more than visual flourish
- **One accent, used with intent**: pick a single distinctive accent color for actions/highlights rather than a generic palette; avoid the "generic fintech blue/teal" look most competitors use
- **Typography that feels calm**: a clean, modern sans for numbers (money should be easy to scan), nothing decorative competing with the data
- **Empty states as invitations**: "No expenses yet — tap + to add your first one," not a blank screen
- **No modal-on-modal**: adding an expense should never feel like navigating through settings menus

## Suggested next steps
1. Lock the MVP feature list above (say yes/cut more)
2. I can put together the actual color/type/layout system and build a first working screen (add-expense + home view) as a live prototype
3. Set up the repo structure and PWA scaffolding

Want me to start on the visual design system and a working prototype next?