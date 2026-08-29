# Interactive AI Learning Tutor System

Production-style **MERN** EdTech platform: MongoDB, Express, React, Node.js.

Admin manages students and content. Students learn, take quizzes, track progress, and talk to a context-aware AI Tutor. The AI Tutor is **not** a human role.

## Stack

| Layer | Technology |
| --- | --- |
| Client | React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zod, Recharts |
| API | Express, JWT cookies + Bearer tokens, Zod validation, Multer uploads |
| Database | MongoDB + Mongoose with indexes |
| AI | Server-side tutor service (`OPENAI_API_KEY` optional; educational fallback if unset) |

## Quick start

1. Install [Node.js 20+](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/try/download/community) (local) or use Atlas.
2. From the project root:

```bash
cd server
npm run seed
cd ..
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:5000

### Demo accounts (after seed)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@edututor.ai` | `Admin@123456` |
| Student | `ahmed@student.ai` | `Student@123456` |

## Environment

Copy `.env.example` values into `server/.env`:

```
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai_learning_tutor
JWT_SECRET=change-this
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

If `OPENAI_API_KEY` is empty, the tutor still answers using a pedagogical fallback and **conversations are still stored**.

MongoDB Atlas: set `MONGODB_URI` to your `mongodb+srv://...` connection string.

## Scripts

```bash
npm run dev          # API + Vite together
npm run seed         # wipe + realistic demo data (development only)
npm run build        # production build
```

## Security model

- Students cannot edit courses, lessons, quizzes, or questions.
- Students only see their own progress, quiz attempts, and AI conversations.
- Admins can manage students (view / add / edit / activate / deactivate) but **cannot fabricate quiz scores**.
- Admins do not get automatic access to private AI chats.
- AI keys never ship in the frontend.

## Product map

- Public: `/` `/about` `/courses` `/login` `/register` `/forgot-password`
- Admin: `/admin/dashboard` `/admin/students` `/admin/courses` `/admin/lessons` `/admin/quizzes` `/admin/questions` `/admin/analytics` `/admin/settings`
- Student: `/student/dashboard` `/student/courses` `/student/lessons/:id` `/student/quizzes/:id` `/student/results/:id` `/student/ai-tutor` `/student/progress` `/student/profile` `/student/settings`
