const fs = require('fs/promises');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set the path to the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegStatic);

const AUDIO_DIR = path.join(__dirname, 'src', 'assets', 'audio');

async function normalizeAudio() {
  try {
    const files = await fs.readdir(AUDIO_DIR);
    
    // Filter for common audio formats
    const audioFiles = files.filter(file => 
      !file.startsWith('temp_') && (
      file.endsWith('.mp3') || 
      file.endsWith('.wav') || 
      file.endsWith('.m4a'))
    );

    if (audioFiles.length === 0) {
      console.log('No audio files found in', AUDIO_DIR);
      return;
    }

    console.log(`Found ${audioFiles.length} audio files. Starting normalization...`);

    for (const file of audioFiles) {
      const inputPath = path.join(AUDIO_DIR, file);
      // Create a temporary file path
      const tempOutputPath = path.join(AUDIO_DIR, `temp_${file}`);

      console.log(`Processing: ${file}...`);

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          // The loudnorm filter automatically normalizes the loudness
          // - I=-14 (Target Integrated Loudness, standard for web/streaming)
          // - TP=-1.5 (True Peak, max peak level)
          // - LRA=11 (Loudness Range)
          .audioFilter('loudnorm=I=-14:TP=-1.5:LRA=11')
          .on('end', () => {
            resolve();
          })
          .on('error', (err) => {
            console.error(`Error processing ${file}:`, err.message);
            reject(err);
          })
          .save(tempOutputPath);
      });

      // Replace original file with the normalized one
      try {
        await fs.unlink(inputPath); // Delete original file first to avoid EPERM on Windows
      } catch (e) {
        console.warn(`Could not delete original file ${inputPath}:`, e.message);
      }
      await fs.rename(tempOutputPath, inputPath);
      console.log(`✅ Normalized and saved: ${file}`);
    }

    console.log('🎉 All audio files have been successfully normalized!');
  } catch (error) {
    console.error('An error occurred during normalization:', error);
  }
}

normalizeAudio();
