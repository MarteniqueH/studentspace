import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Files are kept in memory only long enough to extract text — nothing is
// written to disk, and the raw file is discarded once the request completes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// Swap for whichever current model you want to use.
const ANTHROPIC_MODEL = "claude-sonnet-5";

/* ------------------------------------------------------------------ */
/* Text extraction                                                     */
/* ------------------------------------------------------------------ */

async function extractText({ file, text }) {
  if (text && text.trim()) return text.trim();

  if (file) {
    if (file.mimetype === "application/pdf") {
      const parsed = await pdfParse(file.buffer);
      return parsed.text;
    }
    // .txt or any other plain-text upload
    return file.buffer.toString("utf-8");
  }

  return "";
}

/* ------------------------------------------------------------------ */
/* Prompting                                                            */
/* ------------------------------------------------------------------ */

function buildPrompt(sourceText) {
  return `You are helping a student study. Read the following notes/content and generate study material from it.

Return ONLY valid JSON — no markdown code fences, no commentary before or after — matching exactly this shape:

{
  "flashcards": [
    { "id": "f1", "front": "...", "back": "..." }
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "...",
      "options": [
        { "id": "a", "text": "..." },
        { "id": "b", "text": "..." },
        { "id": "c", "text": "..." },
        { "id": "d", "text": "..." }
      ],
      "correctOptionId": "a",
      "explanation": "..."
    }
  ]
}

Generate 8-12 flashcards and 5-8 multiple choice quiz questions covering the key concepts, definitions, and facts in the content below. Keep flashcard backs concise (1-3 sentences). Make quiz distractors plausible, not obviously wrong. Base everything strictly on the provided content — do not invent facts it doesn't support.

CONTENT:
"""
${sourceText.slice(0, 12000)}
"""`;
}

function parseModelJson(raw) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "");
  return JSON.parse(cleaned);
}

/* ------------------------------------------------------------------ */
/* Route                                                                */
/* ------------------------------------------------------------------ */

app.post("/api/generate-study-material", upload.single("file"), async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY." });
    }

    const sourceText = await extractText({ file: req.file, text: req.body.text });

    if (!sourceText || sourceText.trim().length < 20) {
      return res
        .status(400)
        .json({ error: "Couldn't find enough readable text in that upload." });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4000,
        messages: [{ role: "user", content: buildPrompt(sourceText) }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(502).json({ error: "AI generation failed. Try again." });
    }

    const data = await response.json();
    const textBlock = data.content?.find((b) => b.type === "text");

    if (!textBlock) {
      return res.status(502).json({ error: "AI returned an unexpected response." });
    }

    let studyMaterial;
    try {
      studyMaterial = parseModelJson(textBlock.text);
    } catch (err) {
      console.error("Failed to parse model JSON:", textBlock.text);
      return res.status(502).json({ error: "AI response wasn't valid JSON. Try again." });
    }

    res.json(studyMaterial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong generating study material." });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`StudentSpace API listening on port ${PORT}`));