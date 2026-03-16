import { GoogleGenAI } from "@google/genai";
import { ApiSettings, Message } from "../types";

export async function generateVideo(
  settings: ApiSettings,
  prompt: string,
  startImageUrl?: string,
  duration: number = 5
): Promise<string | null> {
  if (!settings.videoApiKey) {
    console.error("Video generation requires Doubao Video API Key");
    return null;
  }

  try {
    const content: any[] = [
      {
        type: "text",
        text: prompt + ` --resolution 1080p --duration ${duration} --camerafixed false --watermark false`
      }
    ];

    if (startImageUrl && !startImageUrl.startsWith('data:image/')) {
      content.push({
        type: "image_url",
        image_url: {
          url: startImageUrl
        }
      });
    } else if (startImageUrl && startImageUrl.startsWith('data:image/')) {
      try {
        console.log("Uploading base64 image to server to get a public URL for Doubao Video API...");
        const uploadRes = await fetch("/api/upload_image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: startImageUrl })
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          content.push({
            type: "image_url",
            image_url: {
              url: uploadData.url
            }
          });
          console.log("Successfully uploaded image, using URL:", uploadData.url);
        } else {
          console.error("Failed to upload base64 image. Omitting image prompt.");
        }
      } catch (e) {
        console.error("Error uploading base64 image:", e);
      }
    }

    const createRes = await fetch("/api/doubao/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks",
        apiKey: settings.videoApiKey.trim(),
        body: {
          model: "doubao-seedance-1-0-pro-fast-251015",
          content: content
        }
      })
    });

    let createData;
    try {
      createData = await createRes.json();
    } catch (e) {
      console.error("Failed to parse create video task response as JSON. Status:", createRes.status);
      return null;
    }
    if (!createRes.ok) {
      console.error("Failed to create video task:", createData);
      return null;
    }

    const taskId = createData.id || createData.data?.id || createData.task_id || createData.data?.task_id;
    if (!taskId) {
      console.error("No task ID returned:", createData);
      return null;
    }

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (120 * 5s)
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));
      const pollRes = await fetch(`/api/doubao/proxy?baseUrl=${encodeURIComponent(`https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`)}&apiKey=${encodeURIComponent(settings.videoApiKey.trim())}`);
      let pollData;
      try {
        pollData = await pollRes.json();
      } catch (e) {
        console.error("Failed to parse poll video task response as JSON. Status:", pollRes.status);
        return null;
      }

      if (!pollRes.ok) {
        console.error("Failed to poll video task:", pollData);
        return null;
      }

      const status = (pollData.status || pollData.data?.status || pollData.state || pollData.data?.state || '').toLowerCase();
      if (status === 'succeeded' || status === 'completed' || status === 'success') {
        console.log("Video task succeeded, pollData:", JSON.stringify(pollData, null, 2));
        
        let videoUrl = null;
        
        // Try various known paths
        if (pollData.content && Array.isArray(pollData.content)) {
          videoUrl = pollData.content[0]?.video_url?.url || pollData.content[0]?.video_url;
        } else if (pollData.content && typeof pollData.content === 'object') {
          videoUrl = pollData.content.video_url?.url || pollData.content.video_url;
        }
        
        if (!videoUrl && pollData.data?.content && Array.isArray(pollData.data.content)) {
          videoUrl = pollData.data.content[0]?.video_url?.url || pollData.data.content[0]?.video_url;
        } else if (!videoUrl && pollData.data?.content && typeof pollData.data.content === 'object') {
          videoUrl = pollData.data.content.video_url?.url || pollData.data.content.video_url;
        }
        
        if (!videoUrl) {
          videoUrl = pollData.video_url?.url || pollData.video_url || pollData.data?.video_url?.url || pollData.data?.video_url || pollData.data?.video?.url || pollData.data?.video || pollData.data?.url || pollData.url;
        }

        if (!videoUrl) {
          console.error("Could not extract video URL from successful response:", pollData);
        } else {
          try {
            const createdAt = pollData.created_at || pollData.data?.created_at || 0;
            const updatedAt = pollData.updated_at || pollData.data?.updated_at || 0;
            const timeDiff = updatedAt - createdAt;
            const timeTaken = (createdAt && updatedAt) ? Math.round(timeDiff > 100000 ? timeDiff / 1000 : timeDiff) : 'Unknown';

            const logMsg = `
[SUCCESS] 视频生成完成

任务 ID: ${taskId} (用于溯源)
模型名称: doubao-seedance-1-0-pro-fast-251015
分辨率: 1920x1080
宽高比: 16:9
时长: ${duration}.0 秒
帧率 (FPS): 24 fps
生成耗时: ${timeTaken} 秒 (计算 updated_at - created_at)
`;
            console.log(logMsg);
          } catch (e) {
            console.log("[System Log] Failed to generate detailed success log", e);
          }
        }
        
        return videoUrl || null;
      } else if (status === 'failed' || status === 'error') {
        console.error("Video task failed:", pollData);
        return null;
      } else {
        console.log(`Video task status: ${status}, waiting... (Attempt ${attempts}/${maxAttempts})`);
      }
    }
    
    console.error(`Video generation timed out after ${maxAttempts} attempts.`);
    return null;
  } catch (error) {
    console.error("Video generation error:", error);
    return null;
  }
}

export async function callAI(
  settings: ApiSettings,
  messages: Message[],
  systemInstruction: string
): Promise<string> {
  if (settings.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: settings.apiKey || process.env.GEMINI_API_KEY || '' });
    
    // Context management: Last N + Top M relevant
    const recentMessages = messages.slice(-settings.contextLimit);
    
    // Simple RAG: find messages containing keywords from the last message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    let relevantMessages: Message[] = [];
    if (lastUserMessage && messages.length > settings.contextLimit) {
      const keywords = lastUserMessage.content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      relevantMessages = messages
        .slice(0, -settings.contextLimit) // Search in older history
        .filter(m => keywords.some(k => m.content.toLowerCase().includes(k)))
        .slice(0, settings.ragLimit);
    }

    const combinedMessages = [...relevantMessages, ...recentMessages];
    
    let contents = combinedMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Fix: Gemini requires at least one message in contents
    if (contents.length === 0) {
      contents = [{
        role: 'user',
        parts: [{ text: 'Hello' }]
      }];
    }

    try {
      console.log(`[System Log] Calling Gemini LLM model: ${settings.model || "gemini-3-flash-preview"}`);
      const response = await ai.models.generateContent({
        model: settings.model || "gemini-3-flash-preview",
        contents: contents as any,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });
      console.log("[System Log] Gemini LLM Call Success");
      return response.text || "AI failed to respond.";
    } catch (error) {
      console.error("[System Log] Gemini Error:", error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  } else if (settings.provider === 'deepseek') {
    // DeepSeek API call (standard OpenAI-compatible format)
    const recentMessages = messages.slice(-settings.contextLimit);
    const apiMessages = [
      { role: 'system', content: systemInstruction },
      ...recentMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    try {
      console.log(`[System Log] Calling DeepSeek LLM model: ${settings.model || "deepseek-chat"}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: settings.model || "deepseek-chat",
          messages: apiMessages,
          temperature: 0.7,
          stream: false,
          response_format: { type: "json_object" }
        })
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.error) {
        console.error("[System Log] DeepSeek API Error:", data.error);
        throw new Error(data.error.message || "DeepSeek Error");
      }
      console.log("[System Log] DeepSeek LLM Call Success");
      return data.choices[0].message.content;
    } catch (error) {
      console.error("[System Log] DeepSeek Error:", error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  return "Unsupported provider.";
}

export async function testConnection(settings: ApiSettings): Promise<{ success: boolean; message: string }> {
  // Test LLM connection
  try {
    if (settings.provider === 'gemini') {
      console.log(`[System Log] Testing Gemini LLM connection with model: ${settings.model || "gemini-3-flash-preview"}`);
      const ai = new GoogleGenAI({ apiKey: settings.apiKey || process.env.GEMINI_API_KEY || '' });
      await ai.models.generateContent({
        model: settings.model || "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      });
      console.log("[System Log] Gemini LLM Test Success");
    } else if (settings.provider === 'deepseek') {
      console.log(`[System Log] Testing DeepSeek LLM connection with model: ${settings.model || "deepseek-chat"}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for test
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: settings.model || "deepseek-chat",
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5
        })
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const data = await response.json();
        console.error("[System Log] DeepSeek Test Error:", data);
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }
      console.log("[System Log] DeepSeek LLM Test Success");
    }

    // Test Image connection if not gemini
    if (settings.imageProvider === 'doubao') {
      if (!settings.imageApiKey) {
        throw new Error("Doubao API Key is required.");
      }
      if (!settings.imageModel) {
        throw new Error("Doubao Endpoint ID (Model) is required.");
      }
      console.log(`[System Log] Testing Doubao connection with model: ${settings.imageModel}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for test
      const response = await fetch("/api/doubao/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          baseUrl: settings.imageApiUrl || "https://ark.cn-beijing.volces.com/api/v3/images/generations",
          apiKey: settings.imageApiKey.trim(),
          body: {
            model: settings.imageModel.trim(),
            prompt: "test",
            size: "2K" // 2K is required by seedream-5-0
          }
        })
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const data = await response.json();
        console.error("[System Log] Doubao Test Error:", data);
        let errorMsg = `HTTP ${response.status}`;
        if (data.error) {
          if (typeof data.error === 'string') {
            errorMsg = data.error;
          } else if (data.error.message) {
            errorMsg = data.error.message;
          } else {
            errorMsg = JSON.stringify(data.error);
          }
        }
        throw new Error(errorMsg);
      }
      console.log("[System Log] Doubao Test Success");
    }

    // Test Video connection
    if (!settings.videoApiKey) {
      throw new Error("Doubao Video API Key is required.");
    }
    console.log(`[System Log] Testing Doubao Video connection with model: doubao-seedance-1-0-pro-fast-251015`);
    const response = await fetch("/api/doubao/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks",
        apiKey: settings.videoApiKey.trim(),
        body: {
          model: "doubao-seedance-1-0-pro-fast-251015",
          content: [
            {
              type: "text",
              text: "test"
            }
          ]
        }
      })
    });
    if (!response.ok) {
      const data = await response.json();
      console.error("[System Log] Doubao Video Test Error:", data);
      if (response.status === 401 || response.status === 403) {
        throw new Error(data.error?.message || "Invalid Doubao Video API Key or unauthorized.");
      }
    }
    console.log("[System Log] Doubao Video Test Success");

    return { success: true, message: "Connection successful" };
  } catch (error: any) {
    console.error("[System Log] Connection test failed:", error);
    return { success: false, message: error.message || String(error) };
  }
}

export async function generateImage(
  settings: ApiSettings,
  prompt: string
): Promise<string | null> {
  if (settings.imageProvider === 'doubao') {
    const doubaoApiKey = settings.imageApiKey.trim();
    
    const model = settings.imageModel.trim();
    
    // Always use Volcengine Ark API URL for Doubao
    const baseUrl = settings.imageApiUrl || "https://ark.cn-beijing.volces.com/api/v3/images/generations";
    
    if (!doubaoApiKey) {
      console.warn("Doubao Image Generation: No API Key provided. Falling back to Gemini.");
    } else {
      try {
        console.log(`[System Log] Generating image with Doubao model: ${model}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
        
        const response = await fetch("/api/doubao/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          signal: controller.signal,
          body: JSON.stringify({
            baseUrl: baseUrl,
            apiKey: doubaoApiKey,
            body: {
              model: model, 
              prompt: prompt,
              size: "2K",
              response_format: "url",
              extra_body: {
                watermark: true
              }
            }
          })
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const textData = await response.text();
          let data;
          try {
            data = JSON.parse(textData);
          } catch (e) {
            console.error("[System Log] Failed to parse Doubao Image API response as JSON:", textData.substring(0, 100));
            throw new Error("Invalid JSON response from Doubao Image API");
          }
          
          console.log("[System Log] Doubao Image Generation Success");
          if (data.data && data.data[0] && data.data[0].url) {
            return data.data[0].url;
          }
          if (data.data && data.data[0] && data.data[0].b64_json) {
            return `data:image/png;base64,${data.data[0].b64_json}`;
          }
        } else {
          const textData = await response.text();
          let errorData = {};
          try {
            errorData = JSON.parse(textData);
          } catch (e) {
            errorData = { message: textData.substring(0, 100) };
          }
          console.error(`[System Log] Doubao Proxy Error (${response.status}):`, errorData);
          // Fall through to Gemini
        }
      } catch (error) {
        console.error("[System Log] Doubao Image Generation Exception:", error);
      }
    }
  }

  // Fallback to Gemini (only if not already exhausted)
  const geminiKey = settings.apiKey || process.env.GEMINI_API_KEY || '';
  if (!geminiKey) return null;

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  try {
    console.log(`[System Log] Generating image with Gemini model: gemini-2.5-flash-image`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });
    console.log("[System Log] Gemini Image Generation Success");
    for (const part of (response.candidates?.[0]?.content?.parts || [])) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (geminiError: any) {
    // Handle 429 specifically to avoid console spam
    if (geminiError?.message?.includes('429') || geminiError?.status === 429) {
      console.warn("Gemini Image Quota Exhausted (429).");
    } else {
      console.error("Gemini Fallback Image Error:", geminiError);
    }
  }
  
  return null;
}

/**
 * Reserved API Interface for doubao-seedream-5.0-lite
 * This can be used to specifically call the SeeDream model for scene generation.
 */
export async function generateSceneImage(
  settings: ApiSettings,
  prompt: string
): Promise<string | null> {
  // Use the same settings and endpoint ID configured by the user
  return generateImage(settings, prompt);
}
