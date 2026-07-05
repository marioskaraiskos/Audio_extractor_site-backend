import express from "express";
import cors from "cors";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ytDlp from 'yt-dlp-exec';

const app = express();
const PORT = process.env.PORT || 10000; // Correctly grabs environment port or falls back to 10000

// Setup __dirname equivalent since we are using ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// 1. Serve static files from the React frontend build folder
// Ensure your build folder path is correct relative to this file
app.use(express.static(path.join(__dirname, "../frontend/build")));

// --- Helper Functions ---
const sanitizeTitle = (title) =>
  title.replace(/[\\/:*?"<>|\n\r\t]/g, "").trim() || "audio";

// --- API Endpoints ---

// Check root status
app.get("/status", (req, res) => {
  res.send("Server is running 🚀");
});

// Extract / Download Audio Endpoint
app.post("/extract", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Generate unique temporary filenames to prevent concurrent user overlaps
  const uniqueId = Date.now();
  const tempFile = `temp-${uniqueId}.mp3`;
  const tempPath = path.resolve(`./${tempFile}`);

  try {
    // 1. Fetch metadata first to get a safe, sanitized filename
    const meta = await ytDlp(url, {
      dumpJson: true,
      noPlaylist: true,
      extractorArgs: 'youtube:player_client=default,-android_sdkless'
    });

    const title = sanitizeTitle(meta.title || "audio");
    const finalName = `${title}.mp3`;
    const finalPath = path.resolve(`./${finalName}`);

    console.log(`Starting download for: ${title}`);

    // 2. Execute actual download via yt-dlp wrapper wrapper
    await ytDlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      noPlaylist: true,
      extractorArgs: 'youtube:player_client=default,-android_sdkless',
      output: tempPath
    });

    // 3. Move file from temp path to final named path
    await fs.rename(tempPath, finalPath);

    // 4. Send down to client and safely delete file when finished
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    
    res.download(finalPath, finalName, async (downloadErr) => {
      if (downloadErr) console.error("Stream transmission error:", downloadErr);

      // Clean up final path after delivery
      try {
        if (existsSync(finalPath)) {
          await fs.unlink(finalPath);
          console.log(`Cleaned up file: ${finalName}`);
        }
      } catch (unlinkErr) {
        console.error("Cleanup error:", unlinkErr);
      }
    });

  } catch (error) {
    console.error("Download processing failed:", error);
    
    // Cleanup the initial temp file if it got left behind during a crash
    try {
      if (existsSync(tempPath)) await fs.unlink(tempPath);
    } catch (_) {}

    return res.status(500).json({ error: "Download or file processing failed" });
  }
});

// 2. Catch-all: Handle React routing by sending back index.html 
// Keep this AFTER your api endpoints so it doesn't hijack them
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

// Single point of entry for your listener
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});