# Bug Fix Plan

This plan guides you through systematic bug resolution. Please update checkboxes as you complete each step.

## Phase 1: Investigation

### [x] Bug Reproduction

- Understand the reported issue and expected behavior: User wants to use GROQ_API for all AI features.
- Reproduce the bug in a controlled environment: Identified that backend uses Groq but named Gemini, and some documentation/UI still refers to Gemini.
- Document steps to reproduce consistently: Check any AI feature and notice "Gemini" references or potential Gemini API calls.
- Identify affected components and versions: `geminiService.ts`, `routes.ts`, `AIAssistant.tsx`, `TripRecommender.tsx`, `TripSuggestionByBudget.tsx`.

### [x] Root Cause Analysis

- Debug and trace the issue to its source: The codebase was partially migrated to Groq but remains full of Gemini references.
- Identify the root cause of the problem: Incomplete migration from Gemini to Groq.
- Understand why the bug occurs: Confusing naming and potentially missing Groq integration in some parts.
- Check for similar issues in related code: Checked frontend and backend for any remaining Gemini usages.

## Phase 2: Resolution

### [ ] Fix Implementation

- Rename `geminiService.ts` to `groqService.ts` and update class/variable names.
- Update all imports and references in `routes.ts`.
- Update frontend UI components to reflect Groq AI instead of Gemini AI.
- Improve JSON parsing logic in the AI service to handle Groq's output more robustly.

### [ ] Impact Assessment

- Identify areas affected by the change: All AI-powered pages.
- Check for potential side effects: Broken imports or service calls.
- Ensure backward compatibility if needed: Not needed as we are switching APIs.
- Document any breaking changes: No breaking changes for users, just internal cleanup.

## Phase 3: Verification

### [ ] Testing & Verification

- Verify the bug is fixed with the original reproduction steps
- Write regression tests to prevent recurrence
- Test related functionality for side effects
- Perform integration testing if applicable

### [ ] Documentation & Cleanup

- Update relevant documentation
- Add comments explaining the fix
- Clean up any debug code
- Prepare clear commit message

## Notes

- Update this plan as you discover more about the issue
- Check off completed items using [x]
- Add new steps if the bug requires additional investigation
