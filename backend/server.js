import express from "express";
import cors from "cors";
import { execFile } from "child_process";
import fs from "fs/promises"; 
import { existsSync } from "fs";
import path from "path";
import ytDlp from 'yt-dlp-exec';


const express = require('express');
const path = require('path');
const app = express();

// 1. Tell Express to serve the static files from the frontend folder
// (Adjust 'build' or 'public' depending on what your build folder is named)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// 2. Handle any requests by sending back the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(5000, () => console.log('Server running on port 5000'));


const app = express();
const port = process.env.PORT || 10000; // Render defaults to port 10000
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.post("/extract", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Senior Tip: We also strip out any characters that could mess with HTTP headers or shell paths
  const sanitizeTitle = (title) =>
    title.replace(/[\\/:*?"<>|\n\r\t]/g, "").trim() || "audio";

  // Replace your download execFile block with this:
ytDlp(url, {
  extractAudio: true,
  audioFormat: 'mp3',
  noPlaylist: true,
  extractorArgs: 'youtube:player_client=default,-android_sdkless',
  output: tempPath
}).then(() => {
  // Put your file renaming, res.download, and file unlinking logic here!
  console.log("Download finished successfully!");
}).catch((error) => {
  console.error("Download execution error:", error);
  res.status(500).json({ error: "Download failed" });
});

    const title = sanitizeTitle(stdout);
    const finalName = `${title}.mp3`;
    const tempFile = `temp-${Date.now()}.mp3`;
    
    const tempPath = path.resolve(`./${tempFile}`);
    const finalPath = path.resolve(`./${finalName}`);

    const downloadArgs = [
      "-x",
      "--audio-format",
      "mp3",
      "--no-playlist",
      "--extractor-args",
      "youtube:player_client=default,-android_sdkless",
      "-o",
      tempPath,
      url
    ];

    execFile("yt-dlp", downloadArgs, async (error) => {
      if (error) {
        console.error("Download execution error:", error);
        return res.status(500).json({ error: "Download failed" });
      }

      try {
        await fs.rename(tempPath, finalPath);

        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
        
        res.download(finalPath, finalName, async (downloadErr) => {
          if (downloadErr) console.error("Stream error:", downloadErr);

          try {
            if (existsSync(finalPath)) {
              await fs.unlink(finalPath);
            }
          } catch (unlinkErr) {
            console.error("Cleanup error:", unlinkErr);
          }
        });

      } catch (renameErr) {
        console.error("File processing failed:", renameErr);
        return res.status(500).json({ error: "File processing error" });
      }
    });
  });

// ==========================================
// FIX: This block keeps your server alive!
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});