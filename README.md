# MITRA Club Attendance App

A complete attendance tracking application for MITRA club members.

## Overview
This application uses React, Vite, and Firebase (Authentication & Firestore) to track member attendance, manage teams, and visualize analytics.

## Role System
The app features three distinct access levels:
- **Admin**: Full access to all features. Can view global attendance, manage any member, and edit overall configurations.
- **Team Leader**: Can view and manage attendance for members specifically assigned to their team. Can view analytics for their own team.
- **Member**: Can log in to view their own attendance records and analytics, but cannot modify records.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your Firebase configuration values.
   ```bash
   cp .env.example .env
   ```
   You will need values for:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `TEST_EMAIL` (for running scripts)
   - `TEST_PASSWORD` (for running scripts)

3. **Deploy Security Rules**
   Ensure your Firestore security rules are deployed so the app can function securely:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Development

Run the development server:
```bash
npm run dev
```

## Maintenance Scripts

We provide several utility scripts located in the `/scripts` directory. You can run them using the built-in npm aliases:

- `npm run seed`: Seeds the database with dummy teams, leaders, and members for testing.
- `npm run wipeDummies`: Deletes all seeded dummy users from the database. Requires `TEST_EMAIL` and `TEST_PASSWORD` in `.env` configured to an Admin account.
- `npm run testAuth`: Tests Firebase Authentication connectivity.
- `npm run testRead`: Tests Firestore read permissions.
- `npm run checkExcel`: Utility to test reading an Excel spreadsheet.
- `npm run dryrun` / `npm run dryrun2`: Utility scripts for previewing data imports.

## Firestore Architecture & Consistency
The current `firestore.rules` file defines rules for many planned collections across several phases:
- **Phase 1 (Used currently)**: `users`, `teams`, `attendance`
- **Phase 2 (Planned/Unused)**: `courses`, `modules`, `lessons`, `lesson_progress`, `quizzes`, `quiz_attempts`
- **Phase 3 (Planned/Unused)**: `objectives`, `constraints`, `tasks`, `task_assignments`, `projects`, `project_milestones`
- **Phase 4 (Planned/Unused)**: `project_submissions`, `rubrics`, `evaluations`
- **Phase 5 (Planned/Unused)**: `growth`, `skills`
- **Phase 6 (Planned/Unused)**: `notifications`, `audit_logs`

**⚠️ CONSISTENCY FLAG**: Only `users`, `teams`, and `attendance` are currently implemented in the React application (inside `src/services/`). The remaining collections in the rules file are safely secured for future roadmap features, but do not yet have corresponding frontend services or pages. Keep this in mind when developing to prevent the rules and app logic from drifting apart.
