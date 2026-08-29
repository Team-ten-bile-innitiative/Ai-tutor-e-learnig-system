import { connectDb } from "../config/db.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Quiz } from "../models/Quiz.js";
import { Question } from "../models/Question.js";
import { Enrollment } from "../models/Enrollment.js";
import { LessonProgress, CourseProgress } from "../models/Progress.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { Notification, ActivityLog, LearningStreak } from "../models/Engagement.js";
import mongoose from "mongoose";

async function seed() {
  await connectDb();
  await mongoose.connection.dropDatabase();

  const admin = await User.create({
    fullName: "Platform Admin",
    email: "admin@edututor.ai",
    password: "Admin@123456",
    role: "admin",
    status: "active",
    emailVerified: true,
    learningLevel: "advanced",
  });

  const ahmed = await User.create({
    fullName: "Ahmed Hassan",
    email: "ahmed@student.ai",
    password: "Student@123456",
    role: "student",
    status: "active",
    emailVerified: true,
    learningLevel: "beginner",
    lastActive: new Date(),
  });

  const students = [];
  for (const s of [
    { fullName: "Sara Malik", email: "sara@student.ai", learningLevel: "intermediate" as const, status: "active" as const },
    { fullName: "Omar Nasser", email: "omar@student.ai", learningLevel: "beginner" as const, status: "active" as const },
    { fullName: "Layla Ibrahim", email: "layla@student.ai", learningLevel: "advanced" as const, status: "inactive" as const },
  ]) {
    students.push(
      await User.create({
        ...s,
        password: "Student@123456",
        role: "student",
        emailVerified: true,
      })
    );
  }

  const math = await Course.create({
    title: "Mathematics Foundations",
    description: "Master linear equations, fractions, and core algebra with guided lessons, quizzes, and an AI tutor.",
    category: "Math",
    level: "beginner",
    duration: "6 weeks",
    status: "published",
    thumbnailUrl: "",
    instructorName: "Hassan Hussein",
    learningObjectives: ["Solve linear equations", "Work confidently with fractions", "Check answers with inverse operations"],
    createdBy: admin.id,
  });

  const physics = await Course.create({
    title: "Physics Essentials",
    description: "Motion, forces, and energy explained with examples you can apply immediately.",
    category: "Science",
    level: "intermediate",
    duration: "8 weeks",
    status: "published",
    instructorName: "Amina Yusuf",
    learningObjectives: ["Describe motion", "Apply Newton's laws", "Calculate basic energy"],
    createdBy: admin.id,
  });

  const cs = await Course.create({
    title: "Intro to Computer Science",
    description: "Algorithms, variables, and problem-solving for new programmers.",
    category: "Programming",
    level: "beginner",
    duration: "5 weeks",
    status: "draft",
    instructorName: "Omar Farah",
    learningObjectives: ["Think algorithmically", "Use variables and types", "Write simple programs"],
    createdBy: admin.id,
  });

  const catalogExtras = [
    {
      title: "Python for Beginners",
      description: "Learn Python from scratch with clear examples, practice tasks, and guided quizzes.",
      category: "Programming",
      level: "beginner" as const,
      duration: "6 weeks",
      instructorName: "Hassan Hussein",
      learningObjectives: ["Write Python scripts", "Use variables and functions", "Solve beginner problems"],
    },
    {
      title: "JavaScript Essentials",
      description: "Build interactive pages with modern JavaScript, functions, and DOM basics.",
      category: "Programming",
      level: "beginner" as const,
      duration: "5 weeks",
      instructorName: "Omar Farah",
      learningObjectives: ["Understand JS syntax", "Work with arrays and objects", "Handle page events"],
    },
    {
      title: "React & Frontend Apps",
      description: "Create component-based interfaces with React, props, state, and routing.",
      category: "Programming",
      level: "intermediate" as const,
      duration: "7 weeks",
      instructorName: "Layla Noor",
      learningObjectives: ["Build React components", "Manage UI state", "Connect pages with routing"],
    },
    {
      title: "Data Science with Python",
      description: "Analyze data, visualize trends, and tell a clear story with Python tools.",
      category: "Data Science",
      level: "intermediate" as const,
      duration: "8 weeks",
      instructorName: "Amina Yusuf",
      learningObjectives: ["Clean datasets", "Create charts", "Summarize insights"],
    },
    {
      title: "UI/UX Design Basics",
      description: "Design usable screens with layout, color, typography, and simple prototypes.",
      category: "Design",
      level: "beginner" as const,
      duration: "4 weeks",
      instructorName: "Layla Noor",
      learningObjectives: ["Plan user flows", "Apply visual hierarchy", "Prototype a simple screen"],
    },
    {
      title: "Business Fundamentals",
      description: "Understand markets, customers, and how a small product team delivers value.",
      category: "Business",
      level: "beginner" as const,
      duration: "5 weeks",
      instructorName: "Sara Malik",
      learningObjectives: ["Describe a business model", "Map a customer journey", "Set simple goals"],
    },
    {
      title: "AI & Machine Learning",
      description: "Learn how models work, what data they need, and how to use AI tools responsibly.",
      category: "AI & ML",
      level: "intermediate" as const,
      duration: "8 weeks",
      instructorName: "Omar Farah",
      learningObjectives: ["Explain common ML types", "Prepare training data", "Evaluate model quality"],
    },
    {
      title: "English Communication",
      description: "Practice clear speaking and writing for study, work, and everyday conversation.",
      category: "Language",
      level: "beginner" as const,
      duration: "6 weeks",
      instructorName: "Amina Yusuf",
      learningObjectives: ["Build useful vocabulary", "Write short messages", "Speak with more confidence"],
    },
    {
      title: "Personal Growth Habits",
      description: "Build focus, study routines, and goals you can keep without burning out.",
      category: "Personal Development",
      level: "beginner" as const,
      duration: "4 weeks",
      instructorName: "Hassan Hussein",
      learningObjectives: ["Set weekly goals", "Build a study habit", "Review progress honestly"],
    },
    {
      title: "Node.js Backend Basics",
      description: "Create APIs, handle requests, and connect a database with Node.js.",
      category: "Programming",
      level: "intermediate" as const,
      duration: "6 weeks",
      instructorName: "Omar Farah",
      learningObjectives: ["Build REST routes", "Validate input", "Store and read data"],
    },
  ];

  const extraCourses = [];
  for (const extra of catalogExtras) {
    extraCourses.push(
      await Course.create({
        ...extra,
        status: "published",
        thumbnailUrl: "",
        createdBy: admin.id,
      })
    );
  }
  const python = extraCourses[0];
  const javascript = extraCourses[1];
  const habits = extraCourses[8];

  const linear = await Lesson.create({
    course: math.id,
    title: "Linear Equations",
    description: "Solve equations of the form ax + b = c.",
    duration: "20 min",
    orderIndex: 1,
    status: "published",
    learningObjectives: ["Isolate the variable", "Use inverse operations", "Check the solution"],
    content: `# Linear Equations

A **linear equation** is an equation whose graph is a straight line. The simplest form you will use here is:

\\[ ax + b = c \\]

## Goal
Find the value of **x** that makes the equation true.

## Method
1. Subtract or add to move constants away from **x**.
2. Divide or multiply to isolate **x**.
3. Substitute back to check.

## Example
Solve \\( 2x + 5 = 15 \\).

- Subtract 5 from both sides: \\( 2x = 10 \\)
- Divide by 2: \\( x = 5 \\)
- Check: \\( 2(5) + 5 = 15 \\). True.

## Try this
Solve \\( 3x - 4 = 11 \\). Pause and attempt it before asking the AI Tutor.
`,
  });

  const fractions = await Lesson.create({
    course: math.id,
    title: "Fractions",
    description: "Add, subtract, and simplify fractions.",
    duration: "25 min",
    orderIndex: 2,
    status: "published",
    learningObjectives: ["Find equivalent fractions", "Add with common denominators", "Simplify results"],
    content: `# Fractions

A fraction \\( \\frac{a}{b} \\) means **a parts of size 1/b**.

## Adding fractions
Use a **common denominator**.

Example: \\( \\frac{1}{2} + \\frac{1}{4} = \\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4} \\)

## Simplifying
Divide numerator and denominator by the same number.

\\( \\frac{4}{8} = \\frac{1}{2} \\)

If this still feels unclear, open the **AI Tutor** and ask: "Explain this lesson in simpler words."
`,
  });

  await Lesson.create({
    course: math.id,
    title: "Checking Your Work",
    description: "Build the habit of verifying solutions.",
    duration: "12 min",
    orderIndex: 3,
    status: "published",
    learningObjectives: ["Substitute answers", "Estimate reasonableness"],
    content: `# Checking Your Work

After you solve an equation, **plug the answer back in**.

If both sides match, the solution is correct. If not, look for a sign error or a missed inverse operation.
`,
  });

  await Lesson.create({
    course: physics.id,
    title: "Speed and Velocity",
    description: "Distance over time, with direction.",
    duration: "18 min",
    orderIndex: 1,
    status: "published",
    learningObjectives: ["Define speed", "Contrast velocity"],
    content: `# Speed and Velocity

**Speed** is distance divided by time. **Velocity** also includes direction.

Example: 60 km in 2 hours is 30 km/h.
`,
  });

  const quizLinear = await Quiz.create({
    course: math.id,
    lesson: linear.id,
    title: "Linear Equations Basics",
    description: "Check that you can isolate x and verify the result.",
    passingScore: 70,
    timeLimit: 30,
    attemptLimit: 3,
    status: "published",
  });

  const quizFrac = await Quiz.create({
    course: math.id,
    lesson: fractions.id,
    title: "Fractions Basics",
    description: "Practice equivalent fractions and addition.",
    passingScore: 70,
    timeLimit: 20,
    attemptLimit: 3,
    status: "published",
  });

  await Question.insertMany([
    {
      quiz: quizLinear.id,
      questionText: "Solve for x: 2x + 5 = 15",
      questionType: "multiple_choice",
      options: [
        { text: "x = 3", order: 1 },
        { text: "x = 5", order: 2 },
        { text: "x = 10", order: 3 },
        { text: "x = 20", order: 4 },
      ],
      correctAnswer: "x = 5",
      explanation: "Subtract 5, then divide by 2. 2x = 10, so x = 5.",
      difficulty: "easy",
      points: 1,
      orderIndex: 1,
    },
    {
      quiz: quizLinear.id,
      questionText: "If 3x - 4 = 11, then x is 5.",
      questionType: "true_false",
      options: [
        { text: "True", order: 1 },
        { text: "False", order: 2 },
      ],
      correctAnswer: "True",
      explanation: "3x = 15, x = 5.",
      difficulty: "easy",
      points: 1,
      orderIndex: 2,
    },
    {
      quiz: quizLinear.id,
      questionText: "What is the first inverse operation for 2x + 5 = 15?",
      questionType: "short_answer",
      options: [],
      correctAnswer: "subtract 5",
      explanation: "Undo addition first, then undo multiplication.",
      difficulty: "medium",
      points: 2,
      orderIndex: 3,
    },
    {
      quiz: quizFrac.id,
      questionText: "What is 1/2 + 1/4?",
      questionType: "multiple_choice",
      options: [
        { text: "1/6", order: 1 },
        { text: "2/6", order: 2 },
        { text: "3/4", order: 3 },
        { text: "1/8", order: 4 },
      ],
      correctAnswer: "3/4",
      explanation: "Common denominator 4: 2/4 + 1/4 = 3/4.",
      difficulty: "easy",
      points: 1,
      orderIndex: 1,
    },
    {
      quiz: quizFrac.id,
      questionText: "4/8 simplifies to 1/2.",
      questionType: "true_false",
      options: [
        { text: "True", order: 1 },
        { text: "False", order: 2 },
      ],
      correctAnswer: "True",
      explanation: "Divide numerator and denominator by 4.",
      difficulty: "easy",
      points: 1,
      orderIndex: 2,
    },
  ]);

  await Enrollment.create({ student: ahmed.id, course: math.id, status: "active" });
  await CourseProgress.create({ student: ahmed.id, course: math.id, progressPercentage: 33, completed: false });
  await LessonProgress.create({
    student: ahmed.id,
    lesson: linear.id,
    course: math.id,
    completed: true,
    completedAt: new Date(),
    timeSpent: 840,
  });

  await Enrollment.create({ student: ahmed.id, course: python.id, status: "active" });
  await CourseProgress.create({ student: ahmed.id, course: python.id, progressPercentage: 75, completed: false });
  await Enrollment.create({ student: ahmed.id, course: javascript.id, status: "active" });
  await CourseProgress.create({ student: ahmed.id, course: javascript.id, progressPercentage: 40, completed: false });
  await Enrollment.create({ student: ahmed.id, course: physics.id, status: "active" });
  await CourseProgress.create({ student: ahmed.id, course: physics.id, progressPercentage: 12, completed: false });
  await Enrollment.create({ student: ahmed.id, course: habits.id, status: "completed", completedAt: new Date() });
  await CourseProgress.create({ student: ahmed.id, course: habits.id, progressPercentage: 100, completed: true });

  const [sara, omar, layla] = students;
  for (const course of extraCourses) {
    await Enrollment.create({ student: sara.id, course: course.id, status: "active" });
  }
  await Enrollment.create({ student: omar.id, course: python.id, status: "active" });
  await Enrollment.create({ student: omar.id, course: math.id, status: "active" });
  await Enrollment.create({ student: layla.id, course: extraCourses[6].id, status: "active" });
  await Enrollment.create({ student: layla.id, course: extraCourses[3].id, status: "active" });
  await LearningStreak.create({ student: ahmed.id, currentStreak: 7, longestStreak: 7, lastActivityDate: new Date().toISOString().slice(0, 10) });

  const q1 = await Question.findOne({ quiz: quizLinear.id, orderIndex: 1 });
  await QuizAttempt.create({
    student: ahmed.id,
    quiz: quizLinear.id,
    score: 3,
    percentage: 80,
    passed: true,
    startedAt: new Date(Date.now() - 3600000),
    submittedAt: new Date(Date.now() - 3300000),
    timeSpent: 420,
    status: "submitted",
    answers: q1
      ? [{ question: q1._id, answer: "x = 5", isCorrect: true, pointsEarned: 1 }]
      : [],
  });

  await Notification.insertMany([
    { user: ahmed.id, title: "Welcome back", message: "Continue Linear Equations when you are ready.", type: "reminder", link: `/student/lessons/${linear.id}` },
    { user: admin.id, title: "New student registered", message: "Ahmed Hassan joined the platform.", type: "registration", link: "/admin/students" },
  ]);

  await ActivityLog.create({ user: admin.id, action: "course.created", entityType: "course", entityId: math.id });
  await ActivityLog.create({ user: ahmed.id, action: "student.registered", entityType: "user", entityId: ahmed.id });

  console.log("Seed complete");
  console.log("Admin:  admin@edututor.ai / Admin@123456");
  console.log("Student: ahmed@student.ai / Student@123456");
  console.log("Also seeded:", students.map((s) => s.email).join(", "));
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
