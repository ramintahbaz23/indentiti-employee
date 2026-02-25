# Operational Triage Console – Design Audit & Synthetic Test Criteria

## STEP 1: Design Audit (LWC + SLDS + UX)

### A) Clean Hierarchy (Salesforce-realistic)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| "Needs Attention" is the most visually salient section (top, full width) | ✅ | Needs Attention is first content block below page header; no competing hero above it. |
| Only one primary CTA style (brand button) on the screen | ✅ | Single brand button: **"Open highest priority"** in Needs Attention card actions (when items exist). "New Work Order" is **neutral**. Row "View" buttons are **neutral**. |
| No competing hero components above "Needs Attention" | ✅ | Page header has title + subtitle only; primary CTA is inside the Needs Attention card. |

### B) SLDS Consistency

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| Typography uses SLDS defaults | ✅ | Custom font sizes removed; using `slds-text-*` and SLDS spacing tokens where needed. |
| Spacing uses SLDS utilities | ✅ | `slds-m-*`, `slds-p-*`, `slds-gutters`, grid alignment. Dashboard CSS uses `var(--slds-spacing-*)` for padding. |
| Status uses lightning-badge / SLDS pills; icons use lightning-icon | ✅ | Category/status use `slds-badge` classes; Active Work table uses `lightning-icon` for escalation. |

### C) Intentional States (LWC patterns)

| Section | Loading | Empty | Error | Success |
|---------|---------|-------|-------|---------|
| Dashboard | ✅ `lightning-spinner` + "Loading triage data" | N/A | ✅ Inline error box + "Try again" + plain-language message | Toast on open WO |
| Needs Attention | (parent spinner) | ✅ "No items need attention." + "View My Active Work below to see all work orders." | (parent) | — |
| My Active Work | ✅ Spinner in table area | ✅ "No work orders match the filters." + "Try changing or clearing filters above." | (parent) | — |

### D) Recoverable Errors (Salesforce language)

- **What happened:** `errorMessage` (plain language).
- **What to do next:** "Try again, or refresh the page. If the problem continues, contact your administrator."
- **Retry:** "Try again" brand button calls `handleRetry` → `loadMockData()`.

### E) Mobile Friendly (LWC reality)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| Tap targets ≥ 44px | ✅ | `.slds-button` in tables and Needs Attention panel set `min-height: 2.75rem` (44px). |
| No horizontal scroll on page | ✅ | Table wrappers use `overflow-x: auto`; on `max-width: 480px` less critical columns hidden (Active Work: Media, Escalation, Last Updated; Needs Attention: Status, Age/SLA). |
| Body text ≥ 16px | ✅ | SLDS default; no reduction. |
| Tables degrade gracefully | ✅ | Fewer columns on small screens via CSS `nth-child` hide. |

---

## STEP 2: Synthetic User Test Criteria (12 personas)

**Task:** "Find the most urgent Work Order and take the correct next action to resolve it (open it from Needs Attention)."

**Personas (examples):** Dispatcher, coordinator, manager, junior agent, risk-averse, speed-optimized, overloaded, unfamiliar with jargon, etc.

**Capture per run:**

- First area of focus (what they scan first)
- First click
- Can they explain the screen’s purpose?
- Can they identify why the top item is urgent (badge/reason)?
- Time to first correct action

### Success metrics

1. **Clarity in 3 seconds**  
   In a 5-second test, **≥ 80%** of subagents must correctly answer: *"What is this screen for?"*  
   **Expected:** "To show what Work Orders need attention and let me act quickly."

2. **One obvious next action**  
   **≥ 70%** of first clicks go to the intended primary action:
   - **Open top item from "Needs Attention"** (row "View" or row click), OR
   - **"Open highest priority"** (card action), OR
   - A filter that isolates urgent items, then open top result.

3. **LWC usability (above the fold)**  
   **≥ 80%** complete the task without scrolling past the first screenful on desktop.  
   Needs Attention + primary CTA must be above the fold.

4. **Terminology comprehension**  
   **≥ 70%** correctly understand:
   - **"Missing media"** → Required photos/documents not yet uploaded (helptext + inline explanation under Quick filters).
   - **"Quote needs action"** → Quote not sent or needs review (inline explanation).
   - **"Status conflict"** → Quote and work order status don’t match (`lightning-helptext` on Quote Readiness card).

---

## STEP 3: Changes Made (Before/After)

### Before (audit failures)

- Two brand CTAs: "New Work Order" and every row "View Work Order."
- No page subtitle (purpose not clear in 3 seconds).
- No error state or retry.
- Empty states without next step.
- No terminology helptext.
- Custom font sizes; some non-SLDS spacing.
- Tables could force horizontal scroll on mobile; no column hiding.

### After (implemented)

- **Single primary CTA:** "Open highest priority" (brand) in Needs Attention when items exist.
- **New Work Order** and all row **View** buttons are **neutral**.
- **Subtitle:** "Find and act on work orders that need your attention."
- **Error state:** Inline error box + "Try again" + message; `handleRetry` reloads data.
- **Empty states:** Needs Attention and My Active Work include a next step (e.g. "View My Active Work below" / "Try changing or clearing filters").
- **Terminology:** Inline text under Quick filters for Media Missing / Quote Needs Action; `lightning-helptext` for Status Conflict; optional helptext on Media Readiness card.
- **SLDS:** Removed custom font sizes; use SLDS spacing tokens and utilities.
- **Mobile:** Buttons in tables/Needs Attention have min-height 44px; columns hidden on small screens to avoid horizontal scroll.

### How to re-run audit + synthetic tests

1. **Audit:** Walk through A–E above and confirm in the running LWC app (Lightning Experience or preview).
2. **Synthetic tests:** Run 12 persona-based runs (manual or automated), record first focus, first click, comprehension answers, time to first correct action, and whether task completed above the fold.
3. **Iterate:** If any metric is below threshold, adjust layout (e.g. simplify with `lightning-layout`), reduce competing elements, strengthen Needs Attention salience, refine labels/helptext, or table behavior, then re-run and document before/after.
