# Recovery Companion

Build a modern healthcare web app called HealthyAI — Post-Operative Recovery Assistant.

Goal

Help post-operative patients follow their recovery plan, track daily tasks, monitor symptoms, recognize potential warning signs, and get safe guidance.

Design

Use a clean medical blue healthcare theme:

Medical blue, white, light blue-gray

Green for low risk

Amber for medium risk

Red for high risk

Modern cards, rounded corners, subtle shadows

Simple icons

Clean typography

Fully responsive

Professional healthcare SaaS style

Keep the UI simple and easy for patients to understand

Patient Workflow

1. Patient Registration
Collect name, age, surgery type, surgery date, doctor/hospital and contact details.

2. Medical Report Import
Allow PDF/document upload. Simulate AI extraction of:

Surgery details

Medicines

Wound care

Exercise/activity restrictions

Diet

Follow-up date

Warning signs

Let the patient review the extracted information before continuing.

3. Generate Daily Recovery Schedule
Convert the recovery instructions into simple daily tasks:

Medicine

Wound Care

Exercise

Diet

Follow-up

Daily Check-in

Show tasks by Morning, Afternoon, Evening and Night.

4. Reminders
Show upcoming task reminders and allow:

Complete

Snooze

Missed

5. Record Patient Activity
Track completed, missed and skipped tasks.

6. Adherence Score
Calculate and display:

Completed Tasks / Total Tasks × 100

Show overall progress and category-wise progress.

7. Repeated Missed Tasks
Detect important tasks missed repeatedly and show a warning notification.

8. Daily Check-in
Ask the patient about:

Pain level 0–10

Fever

Wound redness/swelling

Bleeding

Discharge

Wound opening

Dizziness

Dehydration symptoms

Leg swelling

Other symptoms

Free-text notes

9. Analyze Symptoms
Use rule-based logic + AI-assisted text analysis to identify potential warning signs.

Do NOT diagnose diseases.

10. Assign Risk Level
Show:

🟢 Low

🟡 Medium

🔴 High

Also show why the risk level was assigned.

11. Safe Recommendation
Give simple, non-diagnostic guidance based on the recovery information.

Example:
"Potential warning signs detected. Please contact your healthcare provider promptly."

12. Generate Alert
Create an alert when concerning symptoms or repeated important missed tasks are detected.

13. Notify Patient
Show in-app notifications for:

Reminders

Missed tasks

Health alerts

Recovery updates

14. Recovery Timeline
Create a visual timeline showing:

Surgery date

Recovery days

Completed/missed tasks

Check-ins

Risk changes

Alerts

Follow-ups

15. AI Recovery Assistant
Add a chatbot called RecoverAI Assistant.

It should answer questions using the patient's imported recovery information and recovery plan.

Example questions:

"What do I need to do today?"

"What tasks have I missed?"

"When is my next medicine?"

"When is my follow-up?"

"Summarize my recovery plan."

The AI must not diagnose, prescribe medicines, change dosages, or override doctor instructions.

Dashboard

Create ONE main Patient Dashboard containing:

Welcome message

Recovery day

Adherence score

Today's tasks

Upcoming reminders

Current risk level

Latest alert

Daily check-in button

Recovery timeline preview

AI Assistant button

Important

Use realistic demo data so the entire flow can be demonstrated without a backend.

Make all major buttons and interactions functional.

Add the disclaimer:

"RecoverAI provides recovery assistance and does not replace professional medical advice."

The final product should feel like a polished, trustworthy healthcare startup application — simple, calm, modern and hackathon-ready.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/db2008db-ed01-494e-bd46-e9ec0def50fe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
