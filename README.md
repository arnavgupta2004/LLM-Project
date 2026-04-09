# iLearn DWD

AI-powered academic platform for IIIT Dharwad with separate student and professor workflows, course-grounded tutoring, assessment management, analytics, and scheduling.

**Live Demo:** [https://iiitdwd-edu.vercel.app](https://iiitdwd-edu.vercel.app)

## Overview

iLearn DWD is a full-stack education platform built to support both teaching and learning inside a single system.

The platform combines:
- course creation and syllabus parsing
- retrieval-augmented student tutoring over uploaded materials
- professor-created quizzes and assignment requests
- student progress intelligence and professor analytics
- page-specific AI assistants
- calendar and interview scheduling
- account profile and settings management

## Roles

### Student
- Enroll in courses using course codes
- Chat with a course-aware AI tutor
- View course materials and assessments
- Track pending work in `To Do`
- Monitor performance in `My Progress`
- Use calendar and request interviews with professors
- Manage profile photo, profile details, and settings

### Professor
- Create courses from syllabus PDFs
- Upload learning materials in `PDF`, `DOCX`, and `PPTX`
- Create quizzes and assignment requests
- Review and answer flagged student questions
- Monitor course analytics and student learning patterns
- Manage classes, office hours, deadlines, and interview requests
- Manage profile photo, profile details, and settings

## Core Features

### 1. AI Tutor with RAG
- Students chat inside a course workspace
- Answers are grounded in uploaded course materials
- Material text is extracted, chunked, embedded, and retrieved with `pgvector`
- Chat responses stream through Groq

### 2. AI-Assisted Course Setup
- Professors upload a syllabus PDF
- Gemini extracts course structure such as units, objectives, and textbooks
- Extracted content is editable before final save

### 3. Assessments
- Professors create quizzes and assignment requests
- Students submit answers or upload assignment files
- AI-assisted evaluation is used for supported assessment flows
- Results feed student progress and professor analytics

### 4. Learning Intelligence
- Student-side progress summaries
- Course-wise objective and performance signals
- Weak-topic and support recommendations
- Professor-side analytics for class trends and student strengths

### 5. Page-Specific AI Assistants
- Dedicated assistants are available on major dashboard pages
- Student pages: `My Courses`, `To Do`, `My Progress`, `Calendar`
- Professor pages: `My Courses`, `Flagged Questions`, `Analytics`, `Calendar`
- These assistants are now powered by Groq and constrained to the page context

### 6. Calendar and Interview Workflow
- Professors can create classes, meetings, office hours, and custom events
- Assessment deadlines also appear in calendar views
- Students can request interview slots
- Professors can review and respond to those requests

### 7. Profile and Settings
- User dropdown with `Profile` and `Settings`
- Editable profile details such as name, bio, branch, age, and avatar
- Profile photo upload from device via Supabase Storage
- Account preferences stored per user

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 14, React 18, App Router |
| Styling | Tailwind CSS, shadcn/ui, Base UI |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Vector Search | pgvector |
| Tutor / Page Chat | Groq |
| Parsing / Evaluation / Embeddings | Google Gemini |
| Deployment | Vercel |

## AI Usage

The project uses a hybrid AI setup:

- **Groq**
  - student course chat tutor
  - page-specific dashboard assistants

- **Gemini**
  - syllabus parsing
  - embeddings for RAG indexing and retrieval
  - assessment-related structured evaluation flows
  - learning intelligence generation

## Product Areas

### Student Dashboard
- `My Courses`
- `To Do`
- `My Progress`
- `Calendar`
- course detail page with AI tutor, materials, assessments, and study support
- profile and settings pages

### Professor Dashboard
- `My Courses`
- `Flagged Questions`
- `Analytics`
- `Calendar`
- course detail page with materials and assessments
- profile and settings pages

## Project Structure

```text
eduai/
├── app/
│   ├── api/
│   │   ├── analytics/
│   │   ├── assessments/
│   │   ├── calendar/
│   │   ├── chat/
│   │   ├── courses/parse-syllabus/
│   │   ├── flagged/answer/
│   │   ├── materials/upload/
│   │   ├── page-chat/
│   │   └── profile/avatar/
│   ├── auth/
│   └── dashboard/
│       ├── professor/
│       └── student/
├── components/
│   ├── professor/
│   ├── shared/
│   ├── student/
│   └── ui/
├── docs/
├── lib/
└── public/
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_ai_studio_key
GROQ_API_KEY=your_groq_api_key
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Run lint checks

```bash
npm run lint
```

## Required Backend Setup

You need a Supabase project with:

- authentication enabled
- PostgreSQL tables used by the app
- `pgvector` enabled
- storage buckets for:
  - course materials
  - assignment submissions
  - profile avatars

The app expects the main academic entities described in [docs/architecture.md](/Users/arnavgupta/Documents/Arnav/Projects/LLM Project/eduai/docs/architecture.md), including:

- `profiles`
- `courses`
- `enrollments`
- `course_units`
- `textbooks`
- `course_materials`
- `course_embeddings`
- `chat_messages`
- `flagged_questions`
- `assessments`
- `quiz_questions`
- `assessment_submissions`
- `student_topic_struggles`
- `calendar_events`
- `interview_requests`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development server |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

## Documentation

Additional project documents are available in [`docs/`](/Users/arnavgupta/Documents/Arnav/Projects/LLM Project/eduai/docs):

- [Project Report](/Users/arnavgupta/Documents/Arnav/Projects/LLM Project/eduai/docs/report.md)
- [Architecture](/Users/arnavgupta/Documents/Arnav/Projects/LLM Project/eduai/docs/architecture.md)
- [API Flows](/Users/arnavgupta/Documents/Arnav/Projects/LLM Project/eduai/docs/api-flows.md)
- [AI and Security Notes](/Users/arnavgupta/Documents/Arnav/Projects/LLM Project/eduai/docs/ai-security.md)
- [Demo Guide](/Users/arnavgupta/Documents/Arnav/Projects/LLM Project/eduai/docs/demo-guide.md)

## Final Notes

This project is designed as a role-based academic platform rather than a single chatbot demo. The main focus is the combination of:

- grounded academic assistance
- real professor workflows
- real student workflows
- analytics and progress visibility
- structured AI integration across the product

If you are evaluating or presenting the project, start with the professor course-creation flow, then show the student course-learning flow, and end with analytics plus calendar coordination.
