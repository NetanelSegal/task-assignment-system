import type { Template } from "./types";

/**
 * Ready-made home assignments for HUMI Group's actual business lines:
 * Localz (urban rentals), WL (foreign-worker housing), Halishka
 * (recruitment & employment), HUMI Depot (furnishing logistics).
 * Keyed so other code (seed) references templates without string lookups.
 */
export const HUMI_TEMPLATE = {
  booking: {
    name: "Apartment booking feature",
    position: "Full-Stack Developer",
    dueInDays: 5,
    links: [
      { label: "Suggested stack — Next.js docs", url: "https://nextjs.org/docs" },
      { label: "Reference UX — Airbnb search flow", url: "https://www.airbnb.com/s/Tel-Aviv/homes" },
    ],
    instructions: `Build a small booking flow for Localz-style short-term rentals:

1. Apartment list page — search by city and date range.
2. Apartment detail page — photos placeholder, amenities, availability calendar.
3. Booking request form — dates, guest details, validation (no overlapping or past dates).

Stack: React or Next.js preferred; the backend may be a mock API or any BaaS.
Deliverables: a Git repo link with a README covering setup, architecture decisions, and what you would do next with more time.`,
    evaluation: `- Code structure, naming, and component design
- Data/state handling and API design
- Edge cases: overlapping bookings, invalid ranges, empty results
- README quality and reasoning about trade-offs
- Bonus: tests, responsive layout`,
  },
  qaBugHunt: {
    name: "Booking flow test plan & bug hunt",
    position: "QA Engineer",
    dueInDays: 3,
    links: [{ label: "Staging environment (demo shop)", url: "https://www.saucedemo.com" }],
    instructions: `Using the staging environment linked below, deliver:

1. A test plan: functional, negative, and edge cases for search → detail → booking.
2. Executed results with any bugs reported (clear reproduction steps, expected vs. actual, severity).
3. Your top 3 candidates for test automation and why.

Deliverables: one document (or spreadsheet) with the plan, results, and bug reports.`,
    evaluation: `- Coverage breadth vs. effort prioritization
- Reproduction quality of reported bugs
- Severity judgment
- Automation picks show ROI thinking`,
  },
  takeover: {
    name: "Building takeover plan",
    position: "Property Manager",
    dueInDays: 4,
    links: [],
    instructions: `You are taking over management of a 40-unit foreign-worker housing building in south Tel Aviv (WL division). Draft a 30/60/90-day plan covering:

1. Intake: inspection checklist and unit condition survey.
2. Maintenance: triage method, budget estimate, urgent vs. deferred work.
3. Compliance: safety and regulatory checklist for worker housing.
4. Tenant communication in a multi-language environment.
5. A monthly reporting format for management.

Deliverables: a 2–4 page plan (any format).`,
    evaluation: `- Practicality and prioritization of the 30/60/90 split
- Awareness of worker-housing regulation and safety
- Budget realism
- Communication approach for non-Hebrew speakers
- Quality of the reporting format`,
  },
  logistics: {
    name: "Furnishing logistics challenge",
    position: "Logistics Coordinator",
    dueInDays: 3,
    links: [],
    instructions: `HUMI Depot must furnish 12 new apartments within 10 days on a ₪180,000 budget. Plan the operation:

1. Procurement list per apartment (standard 3-room worker apartment).
2. Supplier selection and delivery schedule across the 10 days.
3. Storage and transport plan.
4. Risk buffer: what goes wrong and what's your slack?

Deliverables: a budget/schedule spreadsheet plus a 1-page operational plan.`,
    evaluation: `- Budget allocation and realism
- Schedule feasibility and sequencing
- Risk identification and buffers
- Spreadsheet clarity`,
  },
  sourcing: {
    name: "Sourcing & onboarding plan",
    position: "Recruitment Specialist",
    dueInDays: 4,
    links: [
      {
        label: "Population & Immigration Authority (PIBA)",
        url: "https://www.gov.il/he/departments/population_and_immigration_authority",
      },
    ],
    instructions: `Halishka needs to recruit 20 construction workers from abroad for a client. Plan the pipeline end to end:

1. Sourcing channels and screening funnel (with expected drop-off rates).
2. Permit and visa timeline — the regulatory steps and their durations.
3. Arrival onboarding: housing handoff (with the WL team), documents, orientation.
4. KPIs you would track for the first 90 days.

Deliverables: a 2–3 page plan.`,
    evaluation: `- Funnel realism and numbers
- Understanding of the permit/visa process
- Cross-team coordination (housing, employment)
- Sensible KPIs`,
  },
  guest: {
    name: "Guest experience scenarios",
    position: "Guest Experience Specialist",
    dueInDays: 2,
    links: [],
    instructions: `Localz hosts tourists and business travelers in Tel Aviv & Jerusalem. Write your actual responses (the exact text you would send) to three scenarios:

1. A guest arrives at 23:00 and the apartment was not cleaned.
2. A double-booking is discovered one day before a guest's arrival.
3. A guest left an unfair 1-star review after a stay with no reported issues.

For each, add a short internal note: what process change would prevent or soften this?

Deliverables: one document with the three responses + internal notes. English required, Hebrew a plus.`,
    evaluation: `- Tone: empathy without over-promising
- Solution quality and ownership
- Process-improvement thinking
- Writing level`,
  },
} satisfies Record<string, Omit<Template, "id" | "createdAt">>;

export const HUMI_TEMPLATES = Object.values(HUMI_TEMPLATE);
