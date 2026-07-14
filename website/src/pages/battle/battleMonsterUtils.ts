import type { TrainerMonster } from '@services/trainerService';

/**
 * Swap a broken monster image for the placeholder, once.
 *
 * Clearing the handler first matters: if the placeholder itself 404s, the error fires
 * again on the same node and would otherwise loop.
 */
export const handleMonImgError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
  const img = e.target as HTMLImageElement;
  img.onerror = null;
  img.src = '/images/default_mon.png';
};

/** A monster has at least one usable image (main ref, sprite, or back sprite). */
export const monsterHasImage = (m: TrainerMonster): boolean => {
  const img =
    m.img_link ||
    (m.main_ref as string | undefined) ||
    (m.back_sprite as string | undefined);
  return Boolean(img && String(img).trim());
};

/**
 * A monster may only enter battle once it has at least a main reference image
 * (a back sprite alone is not enough). Mirrors the backend gate in
 * WebBattleService.hasMainRef.
 */
export const monsterCanBattle = (m: TrainerMonster): boolean => {
  const main = m.img_link || (m.main_ref as string | undefined);
  return Boolean(main && String(main).trim());
};
