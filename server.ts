import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "@ffmpeg-installer/ffmpeg";
import ffprobeStatic from "@ffprobe-installer/ffprobe";
import { randomUUID } from "crypto";

ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

dotenv.config();

const TEMP_DIR = path.join(process.cwd(), "temp_videos");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use("/temp_videos", express.static(TEMP_DIR));

  app.post("/api/upload_image", async (req, res) => {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }
    try {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      let url = '';
      try {
        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: 'image/png' }), 'image.png');
        
        const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error(`tmpfiles.org upload failed: ${uploadRes.statusText}`);
        }
        const data = await uploadRes.json();
        url = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      } catch (tmpfilesError) {
        console.warn("tmpfiles.org upload failed, falling back to catbox.moe:", tmpfilesError);
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', new Blob([buffer], { type: 'image/png' }), 'image.png');
        
        const uploadRes = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error(`Catbox upload failed: ${uploadRes.statusText}`);
        }
        url = await uploadRes.text();
      }
      
      res.json({ url: url.trim() });
    } catch (error: any) {
      console.error("Image Upload Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video/join", async (req, res) => {
    const { videoUrls } = req.body;
    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return res.status(400).json({ error: "videoUrls array is required" });
    }

    try {
      console.log(`[System Log] Joining ${videoUrls.length} videos...`);
      const sessionId = randomUUID();
      const sessionDir = path.join(TEMP_DIR, sessionId);
      fs.mkdirSync(sessionDir, { recursive: true });

      // Download all videos
      const localPaths: string[] = [];
      for (let i = 0; i < videoUrls.length; i++) {
        const url = videoUrls[i];
        const localPath = path.join(sessionDir, `video_${i}.mp4`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch video ${i}`);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(localPath, Buffer.from(buffer));
        localPaths.push(localPath);
      }

      const outputPath = path.join(sessionDir, "final.mp4");

      if (localPaths.length === 1) {
        fs.copyFileSync(localPaths[0], outputPath);
        return res.json({ url: `/temp_videos/${sessionId}/final.mp4` });
      }

      // Build FFmpeg complex filter for crossfade
      let command = ffmpeg();
      localPaths.forEach(p => command = command.input(p));

      let filterComplex = "";
      
      // Normalize all inputs first to ensure concat works
      // 比例纠偏：如果检测到切片非 16:9，使用 pad 滤镜补齐至 1920x1080。
      // 编码对齐：统一转换为 yuv420p 像素格式，fps=24
      for (let i = 0; i < localPaths.length; i++) {
        filterComplex += `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p,settb=1/90000[v${i}_norm];`;
      }

      let lastStream = "[v0_norm]";
      
      // We assume all videos have the same resolution and framerate from Doubao (1080p)
      // Crossfade duration
      const fadeDuration = 0.5;

      const getMetadata = (file: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          ffmpeg.ffprobe(file, (err, metadata) => {
            if (err) {
              console.warn("ffprobe error:", err);
              resolve(null);
              return;
            }
            resolve(metadata);
          });
        });
      };

      const metadatas = await Promise.all(localPaths.map(getMetadata));
      
      const consistencyLog: any = {
        fragments: localPaths,
        metadata_details: metadatas.map((m, i) => {
          const vStream = m?.streams?.find((s: any) => s.codec_type === 'video');
          return {
            file: localPaths[i],
            codec: vStream?.codec_name || 'unknown',
            pix_fmt: vStream?.pix_fmt || 'unknown',
            resolution: `${vStream?.width}x${vStream?.height}`,
            fps: vStream?.r_frame_rate || 'unknown'
          };
        }),
        check_consistency: {
          res_match: true,
          fps_match: true,
          codec_match: true,
          pix_fmt_match: true
        }
      };

      if (metadatas.length > 0 && metadatas[0]) {
        const firstVideo = metadatas[0].streams?.find((s: any) => s.codec_type === 'video');
        if (firstVideo) {
          for (let i = 1; i < metadatas.length; i++) {
            const currentVideo = metadatas[i]?.streams?.find((s: any) => s.codec_type === 'video');
            if (currentVideo) {
              if (firstVideo.width !== currentVideo.width || firstVideo.height !== currentVideo.height) {
                consistencyLog.check_consistency.res_match = false;
              }
              if (firstVideo.r_frame_rate !== currentVideo.r_frame_rate) {
                consistencyLog.check_consistency.fps_match = false;
              }
              if (firstVideo.codec_name !== currentVideo.codec_name) {
                consistencyLog.check_consistency.codec_match = false;
              }
              if (firstVideo.pix_fmt !== currentVideo.pix_fmt) {
                consistencyLog.check_consistency.pix_fmt_match = false;
              }
            }
          }
        }
      }
      console.log("[System Log] Consistency Check:", JSON.stringify(consistencyLog, null, 2));

      const durations = metadatas.map(metadata => {
        if (!metadata) return 5;
        try {
          let duration = Number(metadata?.format?.duration);
          if (isNaN(duration) || duration <= 0) {
            const videoStream = metadata?.streams?.find((s: any) => s.codec_type === 'video');
            duration = Number(videoStream?.duration);
          }
          return (isNaN(duration) || duration <= 0 ? 5 : duration);
        } catch (e) {
          return 5;
        }
      });
      
      let concatInputs = "";
      for (let i = 0; i < localPaths.length; i++) {
        concatInputs += `[v${i}_norm]`;
      }
      
      // Use standard concat filter instead of xfade for compatibility with older FFmpeg versions
      filterComplex += `${concatInputs}concat=n=${localPaths.length}:v=1:a=0[outv]`;
      lastStream = "[outv]";
      
      console.log("FFmpeg filter complex:", filterComplex);

      let ffmpegCommandStr = "";

      await new Promise((resolve, reject) => {
        command
          .complexFilter(filterComplex, [lastStream.replace(/[\[\]]/g, '')])
          .outputOptions(['-vsync', '2', '-an'])
          .on('start', (cmdLine) => {
            ffmpegCommandStr = cmdLine;
          })
          .on('end', () => {
            const successLog = {
              timestamp: new Date().toISOString(),
              task_type: "VIDEO_JOIN",
              status: "SUCCESS",
              details: {
                fragments: localPaths,
                output: outputPath,
                check_consistency: consistencyLog.check_consistency
              }
            };
            console.log("[System Log] FFmpeg Success Details:\n" + JSON.stringify(successLog, null, 2));
            resolve(null);
          })
          .on('error', (err, stdout, stderr) => {
            const errorLog = {
              timestamp: new Date().toISOString(),
              task_type: "VIDEO_JOIN",
              status: "FAILED",
              error_msg: "Video join failed",
              details: {
                fragments: localPaths,
                check_consistency: consistencyLog.check_consistency,
                ffmpeg_ctx: {
                  command: ffmpegCommandStr,
                  exit_code: (err as any).code || 1,
                  stderr: stderr
                }
              }
            };
            console.error("[System Log] FFmpeg Error Details:\n" + JSON.stringify(errorLog, null, 2));
            reject(new Error(err.message + "\n" + stderr));
          })
          .save(outputPath);
      });

      res.json({ url: `/temp_videos/${sessionId}/final.mp4` });

    } catch (error: any) {
      console.error("Video Join Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/log", (req, res) => {
    const { message } = req.body;
    if (message) {
      console.log(message);
    }
    res.json({ success: true });
  });

  // Generic Proxy endpoint for Doubao API to avoid CORS issues
  app.post("/api/doubao/proxy", async (req, res) => {
    const { baseUrl, apiKey, body } = req.body;

    if (!baseUrl || !apiKey || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      console.log(`[System Log] Proxying request to ${baseUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (e) {
          data = { message: textData };
        }
      }
      
      if (!response.ok) {
        console.error(`[System Log] Upstream Error (${response.status}):`, JSON.stringify(data));
      } else {
        console.log(`[System Log] Upstream Success (${response.status})`);
      }
      
      res.status(response.status).json(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Server Proxy Error: Connection timed out to", baseUrl);
        return res.status(504).json({ error: "Upstream service timeout" });
      }
      console.error("Server Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.get("/api/doubao/proxy", async (req, res) => {
    const { baseUrl, apiKey } = req.query;

    if (!baseUrl || !apiKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      console.log(`[System Log] Proxying GET request to ${baseUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000);

      const response = await fetch(baseUrl as string, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (e) {
          data = { message: textData };
        }
      }
      
      if (!response.ok) {
        console.error(`[System Log] Upstream GET Error (${response.status}):`, JSON.stringify(data));
      } else {
        console.log(`[System Log] Upstream GET Success (${response.status})`);
      }
      
      res.status(response.status).json(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Server Proxy Error: Connection timed out to", baseUrl);
        return res.status(504).json({ error: "Upstream service timeout" });
      }
      console.error("Server Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });
  app.post("/api/doubao/images/generations", async (req, res) => {
    const { baseUrl, apiKey, body } = req.body;

    if (!baseUrl || !apiKey || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      console.log(`[System Log] Proxying request to ${baseUrl} for model ${body.model}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (e) {
          data = { message: textData };
        }
      }
      
      if (!response.ok) {
        console.error(`[System Log] Upstream Error (${response.status}):`, JSON.stringify(data));
      } else {
        console.log(`[System Log] Upstream Success (${response.status})`);
      }
      
      res.status(response.status).json(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Server Proxy Error: Connection timed out to", baseUrl);
        return res.status(504).json({ error: "Upstream service timeout" });
      }
      console.error("Server Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
