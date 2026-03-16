export const getWeatherEffect = (weather: string, lang: 'en' | 'zh') => {
  const w = weather.toLowerCase();
  if (w.includes('雨') || w.includes('rain')) return lang === 'zh' ? '🌧 雨天 (违规惩罚 x1.1, 每轮 -1 HP)' : '🌧 Rain (Violation x1.1, -1 HP/step)';
  if (w.includes('雾') || w.includes('fog')) return lang === 'zh' ? '🌫 大雾 (未探索区域显示???, 视野受限)' : '🌫 Fog (Unexplored areas ???, limited vision)';
  if (w.includes('暴') || w.includes('storm')) return lang === 'zh' ? '🌪 暴风 (违规惩罚 x1.3, 所有行为扣血 x1.3)' : '🌪 Storm (Violation x1.3, All deductions x1.3)';
  if (w.includes('极端') || w.includes('extreme')) return lang === 'zh' ? '⛈ 极端天气 (违规惩罚 x1.5, 每轮 -3 HP)' : '⛈ Extreme (Violation x1.5, -3 HP/step)';
  if (w.includes('晴') || w.includes('clear') || w.includes('sun') || w.includes('好') || w.includes('good')) return lang === 'zh' ? '☀️ 晴天 (违规惩罚 x1.0, 每章结束 +5 HP)' : '☀️ Clear (Violation x1.0, +5 HP/chapter)';
  return lang === 'zh' ? '正常天气 (违规惩罚 x1.0)' : 'Normal weather (Violation x1.0)';
};

export const getTimeEffect = (time: string, lang: 'en' | 'zh') => {
  const t = time.toLowerCase();
  if (t.includes('深夜') || t.includes('late night')) return lang === 'zh' ? '深夜 (违规惩罚 x2.0, 每轮 -5 HP)' : 'Late Night (Violation x2.0, -5 HP/step)';
  if (t.includes('夜') || t.includes('晚') || t.includes('night')) return lang === 'zh' ? '夜晚 (违规惩罚 x1.5, 每轮 -2 HP)' : 'Night (Violation x1.5, -2 HP/step)';
  if (t.includes('黄昏') || t.includes('dusk')) return lang === 'zh' ? '黄昏 (违规惩罚 x1.2, 每轮 -1 HP)' : 'Dusk (Violation x1.2, -1 HP/step)';
  return lang === 'zh' ? '白天 (违规惩罚 x1.0, 每轮 0 HP)' : 'Day (Violation x1.0, 0 HP/step)';
};

export const extractLastFrameFromVideo = async (videoUrl: string): Promise<string> => {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = objectUrl;
      video.muted = true;
      video.playsInline = true;

      video.addEventListener('loadeddata', () => {
        const targetTime = (isFinite(video.duration) && video.duration > 0) ? video.duration - 0.1 : 3.0;
        video.currentTime = targetTime;
      });

      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Could not get canvas context'));
        }
      });

      video.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Error loading video for frame extraction'));
      });
    });
  } catch (error) {
    throw new Error('Failed to fetch video for frame extraction');
  }
};
