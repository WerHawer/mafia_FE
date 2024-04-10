import { random } from "lodash/fp";

export const selectRandomArrItem = <T>(arr: T[]): T => {
  const randomIndex = random(arr.length)(false);

  return arr[randomIndex];
};
