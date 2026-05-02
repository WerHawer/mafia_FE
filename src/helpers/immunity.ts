import { IGame, IGameFlow } from "@/types/game.types.ts";

/**
 * Перша ніч "активна" = мафія може стріляти вже в ніч 1.
 *
 * Це відбувається тільки коли в грі 1 мафія І увімкнено
 * налаштування `skipFirstNightIfOneMafia`. Назва прапора
 * читається як «пропустити обмеження першої ночі для 1 мафії»
 * (тобто дозволити стрілянину відразу).
 *
 * Якщо мафій > 1, ніч 1 — знайомство, стрілянини немає.
 * Якщо 1 мафія і прапор вимкнений — теж без стрілянини в ніч 1.
 */
export const isFirstNightActive = (game: IGame | null): boolean => {
  if (!game) return false;

  const mafiaCount = (game.mafia ?? []).length;
  const skip = game.skipFirstNightIfOneMafia ?? true;

  return mafiaCount === 1 && skip;
};

/**
 * "Вікно життя" імунітету на клієнті.
 *
 * - Якщо перша ніч активна: імунітет діє на day===1 (будь-яка фаза)
 *   і day===2 && !isNight (перший день голосування). З моменту
 *   старту 2-ї ночі — уже неактивний.
 * - Якщо перша ніч пропущена: імунітет діє на day===1 і day===2
 *   (ніч2 — перший постріл). З моменту старту 3-го дня — уже неактивний.
 *
 * Використовується як страхувальний шар на FE поки BE не виконує
 * автозняття самостійно. Коли BE почне скидати поле — ця перевірка
 * продовжить працювати тривіально (поле null ⇒ не імунний).
 */
export const isImmunityPhaseActive = (
  flow: IGameFlow,
  firstNightActive: boolean
): boolean => {
  const { day, isNight } = flow;

  if (firstNightActive) {
    return day === 1 || (day === 2 && !isNight);
  }

  return day === 1 || day === 2;
};
