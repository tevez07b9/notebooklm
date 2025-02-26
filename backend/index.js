import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Load environment variables
dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Open SQLite database
const dbPromise = open({
  filename: "./database.sqlite",
  driver: sqlite3.Database,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS to allow requests from your React app
app.use(cors());

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

function getFilePathFromName(filename) {
  return path.join(__dirname, "uploads", filename);
}

async function extractTextWithPages(pdfPath) {
  const pdfData = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await getDocument({ data: pdfData }).promise;
  let extractedPages = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");

    extractedPages.push({ page: pageNum, text: pageText });
  }

  return extractedPages;
}

// Generate embeddings for a given text
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function generatePdfMetadata(extractedPages, fileName) {
  const textSnippet = extractedPages
    .map((p) => `Page ${p.page} : ${p.text}`)
    .join("\n\n");

  const prompt = `
    Extract metadata from the following document snippet:
    """${textSnippet}"""
    
    Provide the response in the following JSON format:
    {
      "title": "Title of the document",
      "summary": "A two-line summary of the document",
      "keywords": "Comma-separated list of important keywords, with maximum 5 keywords"
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
  });

  try {
    // Strip code block markers (```json ... ```)
    const cleanJson = response.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();

    const metadata = JSON.parse(cleanJson);
    const { title, summary, keywords } = metadata;

    const db = await dbPromise;
    await db.run(
      "CREATE TABLE IF NOT EXISTS pdf_details (fileName TEXT, title TEXT, summary TEXT, keywords TEXT)"
    );

    // Store in database
    db.run(
      `INSERT INTO pdf_details (fileName, title, summary, keywords) VALUES (?, ?, ?, ?)`,
      [fileName, title, summary, keywords]
    );

    return { title, summary, keywords };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return null;
  }
}

// Store extracted pages and embeddings in SQLite
async function storePdfPages(extractedPages, fileName) {
  const db = await dbPromise;
  await db.run(
    "CREATE TABLE IF NOT EXISTS pdf_pages (fileName TEXT, page INTEGER, text TEXT, embedding TEXT)"
  );
  const insertStmt = await db.prepare(
    "INSERT INTO pdf_pages (fileName, page, text, embedding) VALUES (?, ?, ?, ?)"
  );

  for (const { page, text } of extractedPages) {
    const embedding = JSON.stringify(await generateEmbedding(text));
    await insertStmt.run(fileName, page, text, embedding);
  }
  await insertStmt.finalize();
  console.log(`Stored ${extractedPages.length} pages for ${fileName}`);
}

export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error(
      "Vectors must be the same length for cosine similarity calculation."
    );
  }

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// List all uploaded pdfs
app.get("/get-pdfs", async (req, res) => {
  try {
    const db = await dbPromise;

    // Retrieve all pages of the given fileName from the database
    const pdfFiles = await db.all(
      "SELECT fileName, title, summary, keywords FROM pdf_details"
    );

    res.json(pdfFiles);
  } catch (error) {
    console.error("Failed to get pdf files");
  }
});

// File upload endpoint
app.post("/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = getFilePathFromName(req.file.filename);

  try {
    const extractedPages = await extractTextWithPages(filePath);
    await storePdfPages(extractedPages, req.file.filename);
    await generatePdfMetadata(extractedPages, req.file.filename);

    res.json({
      message: "PDF uploaded and text extracted",
      fileName: req.file.filename,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Failed to extract text from PDF" });
  }
});

// Chat API to interact with OpenAI
app.post("/chat", async (req, res) => {
  const { question, fileName } = req.body;

  if (!question || !fileName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const db = await dbPromise;

  // Retrieve all pages of the given fileName from the database
  const pdfPages = await db.all(
    "SELECT page, text, embedding FROM pdf_pages WHERE fileName = ?",
    [fileName]
  );
  if (!pdfPages) {
    return res.status(500).json({ error: "Missing document pages" });
  }
  // console.log("CHAT PAGE EMBEDDING: ", pdfPages?.[0]?.embedding);

  // Generate embedding for the user's question
  const questionEmbedding = await generateEmbedding(question);

  // Perform vector search: Rank pages by cosine similarity
  const rankedPages = pdfPages
    .map(({ page, text, embedding }) => ({
      page,
      text,
      similarity: cosineSimilarity(questionEmbedding, JSON.parse(embedding)),
    }))
    .sort((a, b) => b.similarity - a.similarity); // Sort by highest similarity

  // Filter pages: Only send pages with similarity ≥ 0.8 (80%)
  const relevantPages = rankedPages.filter((p) => p.similarity >= 0.8);

  if (relevantPages.length === 0) {
    return res.json({
      answer: "No highly relevant pages found for this question.",
    });
  }

  const prompt = relevantPages
    .map(
      (p) => `Page ${p.page} (Relevance: ${p.similarity.toFixed(2)}): ${p.text}`
    )
    .join("\n\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a PDF assistant that answers user questions accurately. Your responses must contain inline citations referring to the page number like this: [Page 12].",
        },
        {
          role: "user",
          content: `Here is the PDF content with page numbers along with a similarity factor calculated using vector search, which tells how relevant the page is to the question:\n\n${prompt}\n\nAnswer the following question, embedding inline citations in the format [Page X] wherever necessary: ${question}`,
        },
      ],
    });

    res.json({ answer: response.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: "Failed to fetch response from OpenAI" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
