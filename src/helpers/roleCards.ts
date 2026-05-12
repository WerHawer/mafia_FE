/**
 * Shuffles an array using a string seed to ensure consistency across different players
 * in the same game session.
 */
export const shuffleArrayWithSeed = <T>(array: T[], seed: string): T[] => {
  if (!seed || array.length === 0) return array;

  const shuffled = [...array];
  
  // Simple deterministic pseudo-random generator based on seed string
  let seedValue = 0;
  for (let i = 0; i < seed.length; i++) {
    seedValue = (seedValue << 5) - seedValue + seed.charCodeAt(i);
    seedValue |= 0; // Convert to 32bit integer
  }

  // LCG parameters
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  const random = () => {
    seedValue = (a * seedValue + c) % m;
    return Math.abs(seedValue / m);
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};
