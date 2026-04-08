export const getAudioPath = (filename: string): string => {
  return new URL(`../assets/audio/${filename}`, import.meta.url).href;
};

