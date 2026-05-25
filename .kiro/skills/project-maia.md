---
name: project-maia
description: maia project prompt and rubric workflow guidance for building model-breaking professional prompts, answering input questions, assessing three model rollouts against a golden response, and editing seeded rubrics. use when the user asks about maia, prompt academy, prompt exercises, good vs bad maia prompts, model-breaking prompts with 5-10 input files, failure modes, golden responses, rollout failure analysis, or maia rubric criteria and pass/fail logic.
---

# Project Maia

## Purpose
Use this skill to help with Maia dataset tasks: write professional model-breaking prompts, identify missing prompt attributes, answer input questions, judge model rollouts against a golden response, and refine seeded rubrics.

Maia work must resemble realistic professional work, not puzzles, arbitrary tricks, AI-speak, or fantasy roleplay. A valid prompt must be clear enough that evaluator disagreement points to model failure, not prompt failure.

## Maia Task Workflow
1. **Write a model-breaking prompt** based on an assigned occupation and job description. The prompt must be professional, occupation-specific, and dependent on 5-10 input files.
2. **Answer input questions** describing the ideal response: structure, reasoning, required outputs, calculations, and domain-expert expectations.
3. **Run three model rollouts** using the prompt and input files.
4. **Assess failures** by comparing each rollout to the golden response. At least two of three responses should fail for the task to qualify.
5. **Edit the seeded rubric** so it reliably separates good and bad responses. Aim for 35-55 rubric items with clear weights and pass/fail logic.

## Prompt Academy

### Core Prompt Requirements
Every Maia prompt must satisfy all six attributes before it qualifies, regardless of how well it breaks a model.

1. **Unambiguous**: make the task clear enough that failures are the model's fault, not the prompt's. Avoid vague terms without criteria.
2. **Professional Role & Context**: name the persona, audience, setting, and stakes.
3. **Realistic, Not Contrived**: make it sound like a real email, memo, brief, or work request. Do not use arbitrary riddles.
4. **Timelessness / Relative Dating**: when a date matters, include a stable date with at least a year or an anchored scenario date. Do not rely on the model's real-world clock.
5. **Clear Deliverable**: spell out output format, file name, required sections/tabs, audience, and quality bar.
6. **Clear Constraints**: include must-nots, limits, source rules, operational boundaries, and trade-off guardrails that make the task professionally difficult.

## Required Input Files
Every Maia prompt must include 5-10 required input files. The prompt should be impossible to fully understand, complete, or even interpret correctly without those files. Use spreadsheets, PDFs, emails, briefs, transcripts, notes, logs, policy documents, or templates as appropriate.

### Required Input Files
Every Maia prompt must include 5-10 required input files. The task should be impossible to fully understand, complete, or even interpret correctly without those files. Use spreadsheets, PDFs, emails, briefs, transcripts, notes, logs, policy documents, templates, screenshots, or logs as appropriate.

### Real Complexity Levers
Add difficulty through professional reality, not bulk or tricks.

- **Conflicting constraints**: two rules cannot both be fully satisfied, forcing a trade-off.
- **Implicit variables**: a small detail changes the answer but is not called out.
- **Data reconciliation**: rows or facts do not match across files; the model must exclude, clean, or reconcile rather than invent matches.
- **Domain-knowledge outliers**: values look normal but are clearly wrong to an expert.
- **Creative tension**: two technical asks pull against each other like real craft work.
- **Strict deliverable specs**: exact file type, file name, tab order, structure, no hard-coded cells, no invented numbers, or a firm-specific template.

Artificial difficulty examples: arbitrary name/time rules, ignoring data for no reason, subjective ungradable tasks, or Simon-Says constraints. Real difficulty examples: scheduling around emergency constraints, payroll or investment pro-rating, messy data mapping, compliance trade-offs, operational prioritization, or professional creative trade-offs.

### Failure Modes to Target
A Maia prompt is valid only if it reliably induces at least one meaningful model failure mode.

#### Extraction Failures
The model fails to pull correct data from messy input files.
- **Hallucination**: invents missing data to fill a gap.
- **Omission**: misses a buried critical detail such as a footnote, sub-tab, or appendix.
- **Misinterpretation**: reads the data but misunderstands context, such as treating projections as actuals.

Induce extraction failures by burying critical facts, mixing projections with actuals, and leaving tempting but invalid fillable gaps.

#### Reasoning Failures
The model has the right data but does the wrong thing with it.
- **Dependency collapse**: solves step 1 but forgets step 2 depends on it.
- **Constraint violation**: ignores a must-not to satisfy a positive goal.
- **Invalid inference**: makes a professionally unsound leap, such as assuming revenue equals profit.

Induce reasoning failures by stacking 3+ dependent calculations, adding a negative constraint that conflicts with a positive goal, and requiring domain knowledge to spot invalid inferences.

#### Formatting & Deliverable Failures
The answer may be substantively right but packaged incorrectly.
- **Wrong output format**: asks for downloadable CSV but gets a text table.
- **Structure mismatch**: asks for a memo with executive summary but gets a casual email.
- **Formula stagnation**: asks for dynamic Excel formulas but gets hard-coded values.

Induce deliverable failures by requiring precise file types, named tabs in a strict order, dynamic formulas, or a firm-specific template.

## Attribute Evaluation Rules
Use these rules when judging prompt exercises or diagnosing a Maia prompt.

- Mark **Unambiguous** when vague words make completeness or decision logic unclear: e.g. "near," "visually appealing," "easy to read," "key trends," "brief observations," "requests," or "talking points" without criteria.
- Mark **Clear Deliverable** when the output package is underspecified: missing Word/PDF/Excel/PPT, file name, page count, tab names, sections, structure, subject line, required tables, or required metrics.
- Mark **Clear Constraints** when professional guardrails are missing: budget, preferences, scheduling windows, vendor availability, working days, no-overlap rules, lead times, escalation criteria, thresholds, compliance boundaries, presentation time limits, political sensitivities, policy interpretation boundaries, decision criteria, leadership framing rules, or source-use limits.
- For recommendation or executive decision tasks, mark **Clear Constraints** if the prompt lacks the operational, financial, policy, legal, compliance, or escalation boundaries that determine how the recommendation should be made or framed.
- Do **not** mark Clear Constraints just because scope or deliverable details are vague; those are usually Unambiguous or Clear Deliverable.
- Mark **Timelessness** only when there is unstable time phrasing or missing date anchoring where dates matter. Do not mark it merely because the topic could change over time.
- Do **not** mark Timelessness when no date is required, when no unstable date phrasing is introduced, or when a contextual meeting/date does not affect answer stability.
- Do **not** mark Professional Role & Context if role, audience/use case, and stakes are already clear.
- Do **not** mark Realistic & Not Contrived if the task resembles plausible operational, concierge, training, government, financial, property, or claims work.

## Known Prompt Exercise Answers
Use these as calibration examples.

| exercise | correct missing / errored attributes | key rationale |
|---|---|---|
| ex-01 luxury concierge: napa wineries | unambiguous; clear deliverable; clear constraints | "near the hotel" and "visually appealing" are subjective; "shareable document" lacks Word/PDF, page count, and formatting; real concierge constraints such as budget, preferences, scheduling windows, and sourcing rules are missing. |
| ex-02 ultra-hnw istanbul itinerary | unambiguous; clear constraints | "miscellaneous items" and "easy to read" are subjective; constraints such as budget, travel-time windows, dietary restrictions, and security protocols are missing. Clear Deliverable is not an error because Excel, four tabs, and clickable links are stated. |
| ex-03 car rental: rental agreement guide | clear deliverable; clear constraints | guide omits format, structure, and page count; missing operational constraints such as downtime, difficult customers, or escalation. No date is required. |
| ex-04 daily closed operational report | unambiguous; clear deliverable; clear constraints | "key trends" and "brief observations" lack metric/insight criteria; report lacks file type, naming, tabs/sections, and exact metrics; thresholds, comparisons, and escalation criteria are missing. |
| ex-05 ord damage + damage revenue report | unambiguous; timelessness; clear deliverable | "create a report" and "conclusions" do not define cuts or conclusion scope; "september 18th" lacks a year; second deliverable lacks Excel/PDF, structure, and summary tables. Clear Constraints is not the primary issue. |
| ex-07 turn vacant units timeline | unambiguous; clear constraints | "date of work" is underspecified because scheduling rules were removed; missing vendor availability windows, staff workdays, no-overlap rules, weekends/holidays, and appliance lead times. No Timelessness error because 6/30/25 anchors the move-out date. |
| ex-08 tsp funds + transition benefits email | unambiguous; clear deliverable | "requests" is vague after specific requested items were removed; email lacks subject line, structure, and two-part request definition. No Clear Constraints or Timelessness error. |
| ex-09 elder exploitation training deck + roleplay pdfs | unambiguous; clear deliverable; clear constraints | "quick training deck" and "practical and engaging" are subjective; deck lacks PPT/PDF format, page count, and structure; missing escalation protocols, supervisor involvement, compliance boundaries, and interaction time limits. No Timelessness error. |
| ex-10 ecid constituent summary + talking points | unambiguous; clear constraints | "talking points" lacks number, structure, or priority topics; missing board priority topics, time limits, and political sensitivities. Clear Deliverable is not an error because one-page summary PDF and talking-points PDF are stated. |
| ex-11 identity theft claims: slide deck | unambiguous; clear deliverable; clear constraints | "summary of results" and "recommendation" are vague because required metrics, financial impact, dollars, percentages, policy language options, and decision criteria are undefined; "create a slide deck" lacks slide count, PPT vs PDF format, and required sections beyond broad headings; missing financial thresholds for escalation, policy interpretation boundaries, and compliance requirements for leadership recommendations. No Professional Role & Context, Realistic & Not Contrived, or Timelessness error. |



## Answering User Requests
When asked to answer Maia exercises, give the exact attributes to select first, then brief rationales. Avoid over-selecting attributes. If the user provides official feedback, update the calibration and explain the corrected distinction.

When asked to create a Maia prompt, produce a professional prompt that includes role, audience, stakes, stable scenario date if needed, 5-10 input files, real complexity levers, strict deliverable specs, source limits, and at least one target failure mode.

When asked to refine a Maia rubric, make criteria objective and checkable, avoid duplicate items, assign meaningful weights, and include pass/fail logic that catches extraction, reasoning, and deliverable failures.
