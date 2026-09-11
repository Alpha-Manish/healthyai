# Three-language support

## Goal
Add complete English, Hindi, and Gujarati support across onboarding, dashboard, check-ins, notifications, recovery timeline, assistant, and error screens.

## What will change
- Add a shared language system with English as the default and remember the patient's selection in the browser.
- Add an accessible language selector to onboarding and the main header so language can be changed at any time.
- Translate all interface copy, form labels, buttons, status/risk labels, alerts, notifications, task categories, seeded recovery instructions, and timeline text.
- Format dates with the selected language while preserving patient names, medicine names, doses, and other clinical values.
- Send the selected language to RecoverAI and symptom analysis so generated answers, reasons, and recommendations use the chosen language.
- Translate safe fallback symptom guidance so the experience remains localized if AI is unavailable.
- Localize not-found and error screens.

## Technical details
- Use a typed React language context and centralized translation dictionaries; no external translation service is required.
- Keep internal task/category/status identifiers unchanged and translate only at display boundaries.
- Preserve the existing clinical safety rules and AI disclaimer in every language.
- Update the document language attribute when the selection changes.
- Verify onboarding and dashboard flows in all three languages at desktop and mobile widths, plus chat and check-in behavior.
