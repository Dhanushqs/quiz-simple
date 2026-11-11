import { HttpError } from "./errors.js";
import { validateQuestion } from "./logic.js";

export const QUESTION_COUNT = 10;

// Groq's free plan allows roughly 12,000 tokens per minute, so we only send the
// first ~20,000 characters (about 5,000 tokens) of the study material.
const MAX_CHARS = 20000;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// If one model is refused, the next one is tried automatically.
// You can put your own choice first with the optional GROQ_MODEL setting.
const DEFAULT_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];

function buildPrompt(text) {
  return `Using ONLY the study material below, write exactly ${QUESTION_COUNT} multiple-choice questions.

Rules:
- Each question has exactly 4 options and exactly ONE correct answer.
- Wrong options must be plausible, but clearly wrong according to the material.
- Test understanding of the important ideas, not trivia such as page numbers or formatting.
- Mix easy, medium and harder questions. Do not repeat the same question.
- Never say "according to the text/passage/material". Every question must make sense on its own.
- Keep options short. No "A)" or "1." prefixes. Do not use "All of the above" or "None of the above".
- Spread the correct answer across different positions.
- "correct_index" is the position (0, 1, 2 or 3) of the correct option inside "options".

Reply with JSON only, in exactly this shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"correct_index":0}]}

<study_material>
${text}
</study_material>`;
}

// One request to Groq. Never throws: returns { ok, content } or { ok:false, status, reason }.
async function callGroq({ apiKey, model, text, jsonMode }) {
  const body = {
    model,
    temperature: 0.4,
    max_tokens: 4000,
    messages: [
      { role: "system", content: "You are an experienced teacher who writes accurate multiple-choice quizzes. You reply with JSON only." },
      { role: "user", content: buildPrompt(text) },
    ],
  };
  if (jsonMode) body.response_format = { type: "json_object" }; // forces valid JSON back

  let res;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
  } catch (err) {
    console.error(`Groq request failed (${model}): network/timeout`, err);
    return { ok: false, status: 0, reason: "could not reach Groq (timeout)" };
  }

  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    let reason = raw;
    try {
      reason = JSON.parse(raw)?.error?.message || raw;
    } catch {
      /* keep raw text */
    }
    console.error(`Groq request failed (${model}) status ${res.status}:`, raw.slice(0, 600));
    return { ok: false, status: res.status, reason: String(reason).slice(0, 250) };
  }

  try {
    return { ok: true, content: JSON.parse(raw)?.choices?.[0]?.message?.content ?? "" };
  } catch {
    return { ok: false, status: 0, reason: "Groq sent an unreadable reply" };
  }
}

// Turns the AI's reply into a list of valid questions (bad ones are skipped).
function parseQuestions(content) {
  let data;
  try {
    // Some models wrap the JSON in ```json fences or add a sentence: keep only { ... }
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    data = JSON.parse(content.slice(start, end + 1));
  } catch {
    console.error("AI returned invalid JSON:", String(content).slice(0, 300));
    return [];
  }
  const raw = Array.isArray(data?.questions) ? data.questions : [];
  const good = [];
  raw.forEach((q, i) => {
    try {
      good.push(validateQuestion(q, i));
    } catch {
      /* skip a malformed question */
    }
  });
  return good;
}

export async function generateQuestions(studyText) {
  const apiKey = (process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) throw new HttpError(500, "GROQ_API_KEY is missing in the Vercel settings. Add it, then redeploy.");

  const text = studyText.replace(/\s+\n/g, "\n").trim().slice(0, MAX_CHARS);
  const custom = (process.env.GROQ_MODEL || "").trim();
  const models = [...new Set([custom, ...DEFAULT_MODELS].filter(Boolean))];

  const started = Date.now();
  let best = [];
  let lastReason = "";

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (Date.now() - started > 30000) break; // stay inside Vercel's 60 second limit

      let result = await callGroq({ apiKey, model, text, jsonMode: true });
      // Some models don't support JSON mode: try once more without it.
      if (!result.ok && result.status === 400) {
        result = await callGroq({ apiKey, model, text, jsonMode: false });
      }

      if (!result.ok) {
        if (result.status === 401) {
          throw new HttpError(502, "Groq rejected your API key. Check GROQ_API_KEY in Vercel (it should start with gsk_), then redeploy.");
        }
        if (result.status === 429) {
          throw new HttpError(502, "Groq rate limit reached. Wait one minute and click Generate again.");
        }
        if (result.status === 413) {
          throw new HttpError(502, "The study material is too large for Groq's limits. Use a shorter file.");
        }
        lastReason = result.reason;
        if (result.status === 400 || result.status === 404) break; // this model is refused: try the next one
        continue; // temporary problem: retry once
      }

      const questions = parseQuestions(result.content);
      if (questions.length >= QUESTION_COUNT) return questions.slice(0, QUESTION_COUNT);
      if (questions.length > best.length) best = questions;
    }
  }

  if (best.length) {
    throw new HttpError(
      502,
      `The AI produced only ${best.length} valid questions. Please click Generate again (a longer or clearer document helps).`
    );
  }
  throw new HttpError(
    502,
    `Groq could not generate the questions. Groq says: ${lastReason || "no details"}. Open the Vercel logs for more.`
  );
}
