import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

async function test() {
  // Create dummy videos
  await new Promise((resolve) => {
    ffmpeg()
      .input('color=c=red:s=1280x720:d=3')
      .inputFormat('lavfi')
      .output('test1.mp4')
      .on('end', resolve)
      .run();
  });
  
  await new Promise((resolve) => {
    ffmpeg()
      .input('color=c=blue:s=1280x720:d=0.3')
      .inputFormat('lavfi')
      .output('test2.mp4')
      .on('end', resolve)
      .run();
  });

  await new Promise((resolve) => {
    ffmpeg()
      .input('color=c=green:s=1280x720:d=3')
      .inputFormat('lavfi')
      .output('test3.mp4')
      .on('end', resolve)
      .run();
  });

  const localPaths = ['test1.mp4', 'test2.mp4', 'test3.mp4'];
  let command = ffmpeg();
  localPaths.forEach(p => command = command.input(p));

  let filterComplex = "";
  for (let i = 0; i < localPaths.length; i++) {
    filterComplex += `[${i}:v]scale=1280:720,fps=30,format=yuv420p,settb=1/90000[v${i}_norm];`;
  }

  let lastStream = "[v0_norm]";
  const fadeDuration = 0.5;
  const getDuration = (file) => {
    return new Promise((resolve, reject) => {
      if (file === 'test2.mp4') resolve(0.3);
      else resolve(3);
    });
  };

  const durations = await Promise.all(localPaths.map(getDuration));
  console.log("Durations:", durations);
  
  let currentOffset = durations[0];
  
  for (let i = 1; i < localPaths.length; i++) {
    const nextStream = `[v${i}_norm]`;
    const outStream = `[v${i}_fade]`;
    
    // Calculate dynamic fade duration to prevent overlapping crossfades
    const currentFadeDuration = Math.min(0.5, durations[i-1] / 2, durations[i] / 2);
    
    // Offset is the end of the previous video minus the fade duration
    currentOffset -= currentFadeDuration;
    
    const formattedOffset = currentOffset.toFixed(3);
    const formattedFade = currentFadeDuration.toFixed(3);
    
    filterComplex += `${lastStream}${nextStream}xfade=transition=fade:duration=${formattedFade}:offset=${formattedOffset}${outStream};`;
    lastStream = outStream;
    
    // The new end of the video is the current offset plus the duration of the new video
    currentOffset += durations[i];
  }

  filterComplex = filterComplex.slice(0, -1);
  console.log(filterComplex);

  await new Promise((resolve, reject) => {
    command
      .complexFilter(filterComplex, [lastStream.replace(/[\[\]]/g, '')])
      .outputOptions(['-vsync', '2', '-an'])
      .on('end', resolve)
      .on('error', (err, stdout, stderr) => {
        console.error("FFmpeg Error:", err);
        console.error("FFmpeg stderr:", stderr);
        reject(err);
      })
      .save('output.mp4');
  });

  await new Promise((resolve) => {
    ffmpeg.ffprobe('output.mp4', (err, metadata) => {
      console.log("Output duration:", metadata?.format?.duration);
      resolve();
    });
  });
}

test().catch(console.error);
