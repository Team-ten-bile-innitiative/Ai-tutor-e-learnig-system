import { env } from "../config/env.js";

export interface TutorContext {
  studentName: string;
  learningLevel: string;
  courseTitle?: string;
  lessonTitle?: string;
  lessonContent?: string;
  quizTitle?: string;
  lastMistake?: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a warm, professional personal AI tutor for an educational platform.
Your job is to help the student UNDERSTAND, not to complete homework for them.

Pedagogy:
1. Understand the question.
2. Explain the concept at the student's learning level.
3. Give one clear example.
4. Ask a small practice question.
5. Encourage the student to try.
6. If they are struggling, simplify. If they understand, increase difficulty slightly.

Rules:
- Stay on educational topics.
- Use the current course/lesson context when the student says "this" or "it".
- Never reveal quiz answers before the student has submitted a quiz.
- Use markdown: headings, lists, code blocks, and math when useful.
- Be concise, encouraging, and precise.
- Do not request private personal data.`;

function buildContextBlock(ctx: TutorContext) {
  const lines = [
    `Student name: ${ctx.studentName}`,
    `Learning level: ${ctx.learningLevel}`,
  ];
  if (ctx.courseTitle) lines.push(`Current course: ${ctx.courseTitle}`);
  if (ctx.lessonTitle) lines.push(`Current lesson: ${ctx.lessonTitle}`);
  if (ctx.lessonContent) lines.push(`Lesson excerpt:\n${ctx.lessonContent.slice(0, 2500)}`);
  if (ctx.quizTitle) lines.push(`Related quiz: ${ctx.quizTitle}`);
  if (ctx.lastMistake) lines.push(`Recent mistake to help with: ${ctx.lastMistake}`);
  return lines.join("\n");
}

async function callOpenAI(messages: Array<{ role: string; content: string }>) {
  const res = await fetch(`${env.openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.openaiModel,
      temperature: 0.5,
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI provider error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() || "Let us try that again — could you rephrase your question?";
}

function fallbackTutor(userMessage: string, ctx: TutorContext) {
  const topic = ctx.lessonTitle || ctx.courseTitle || "this topic";
  const level = ctx.learningLevel || "beginner";
  const excerpt = ctx.lessonContent ? `\n\nFrom your lesson:\n> ${ctx.lessonContent.slice(0, 400)}` : "";
  const lower = userMessage.toLowerCase();

  if (lower.includes("quiz me") || lower.includes("practice")) {
    return `Let's practice **${topic}** at a ${level} level.

**Example**
Think of the idea in small steps, then try it yourself.

**Your turn**
Explain ${topic} in your own words, or solve a related mini-problem.

I will check your answer next. What do you think?${excerpt}`;
  }

  if (lower.includes("mistake") || lower.includes("wrong") || lower.includes("incorrect")) {
    return `Let's understand this — not just mark it wrong.

**Your answer** may have skipped a step or mixed two ideas.

**A clearer way**
1. Restate the question.
2. Recall the rule from **${topic}**.
3. Apply it slowly.
4. Check the result.

**Learning tip**
Mistakes are a map. They show which step needs more practice.

Would you like a simpler explanation, or another example?${excerpt}`;
  }

  if (lower.includes("simply") || lower.includes("simple") || lower.includes("don't understand") || lower.includes("dont understand")) {
    return `No problem — let's slow down.

**${topic}**, simply:
Imagine explaining it to a friend in one sentence, then adding one example.

At the **${level}** level, start with the meaning, then the method, then a tiny practice item.

**Example**
Use one everyday situation that matches the idea, then connect it back to the lesson.

**Try this**
What part feels confusing — the meaning, the steps, or the example?${excerpt}`;
  }

  return `Great question about **${topic}**.

**What it means**
${topic} is easier when we split it into: idea → example → practice.

**Example**
Apply the main rule from the lesson to a short, concrete case.

**Now you try**
Restate the idea in one sentence, then I will give feedback and a slightly harder follow-up.

If you want, I can also:
- Explain it more simply
- Give another example
- Quiz you on this lesson${excerpt}`;
}

export async function generateTutorReply(userMessage: string, history: ChatTurn[], ctx: TutorContext) {
  const contextBlock = buildContextBlock(ctx);
  if (env.openaiKey) {
    try {
      return await callOpenAI([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Learning context (no extra private data):\n${contextBlock}` },
        ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage },
      ]);
    } catch (err) {
      console.error("AI provider failed, using educational fallback", err);
    }
  }
  return fallbackTutor(userMessage, ctx);
}

export async function generateQuizFeedback(input: {
  studentName: string;
  quizTitle: string;
  percentage: number;
  passed: boolean;
  strengths: string[];
  weakAreas: string[];
  recommendedLessons: string[];
}) {
  const prompt = `Write encouraging quiz feedback for ${input.studentName}.
Quiz: ${input.quizTitle}
Score: ${input.percentage}% (${input.passed ? "passed" : "did not pass"})
Strengths: ${input.strengths.join("; ") || "effort and persistence"}
Weak areas: ${input.weakAreas.join("; ") || "none highlighted"}
Recommended lessons: ${input.recommendedLessons.join("; ") || "continue current course"}
Return a short markdown summary with Strengths, Weak areas, and What to study next.`;

  if (env.openaiKey) {
    try {
      return await callOpenAI([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ]);
    } catch (err) {
      console.error(err);
    }
  }

  const tone = input.passed ? "Good work!" : "Let's understand this and keep going.";
  return `${tone} You scored **${input.percentage}%** on ${input.quizTitle}.

**Strengths**
${(input.strengths.length ? input.strengths : ["You completed the quiz and showed up to practice."]).map((s) => `- ${s}`).join("\n")}

**Weak areas**
${(input.weakAreas.length ? input.weakAreas : ["No major weak areas stood out. Review any missed items once."]).map((s) => `- ${s}`).join("\n")}

**What to study next**
${(input.recommendedLessons.length ? input.recommendedLessons : ["Continue the next lesson in this course."]).map((s) => `- ${s}`).join("\n")}
`;
}
