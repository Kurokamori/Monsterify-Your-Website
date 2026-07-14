import type { CSSProperties } from 'react';

/**
 * Shared presentation helpers for battle visual assets (backgrounds, place-spots and
 * text-box skins). Used by both the live Battle Arena and the Battle Assets admin
 * preview so the two always draw scenery identically.
 */

/**
 * Class applied to any element drawing a battle asset that is flagged `pixelated`,
 * switching the browser from its default smooth (bilinear) upscaling to nearest
 * neighbour so pixel art keeps hard edges. Defined in styles/battle/battle-arena.css.
 */
export const PIXELATED_CLASS: string = 'battle-asset--pixelated';

/** `PIXELATED_CLASS` when the asset asks for nearest-neighbour scaling, otherwise nothing. */
export function pixelatedClass(pixelated: boolean | null | undefined): string {
  return pixelated ? PIXELATED_CLASS : '';
}

/** The nine-slice inset used when a text-box skin does not specify one. */
export const DEFAULT_TEXTBOX_SLICE: number = 24;

/** Normalize a stored slice inset, falling back to the default for missing/invalid values. */
export function resolveTextboxSlice(sliceInset: number | null | undefined): number {
  return sliceInset && sliceInset > 0 ? sliceInset : DEFAULT_TEXTBOX_SLICE;
}

/**
 * Inline style that frames a dialogue box with a text-box skin as a CSS nine-slice.
 * Returns an empty style object when no skin is set, so the built-in CSS box shows through.
 */
export function textboxSkinStyle(
  textboxUrl: string | null | undefined,
  sliceInset: number | null | undefined,
): CSSProperties {
  if (!textboxUrl) {
    return {};
  }
  const slice: number = resolveTextboxSlice(sliceInset);
  return {
    borderStyle: 'solid',
    borderWidth: `${slice}px`,
    borderColor: 'transparent',
    borderImageSource: `url(${textboxUrl})`,
    borderImageSlice: `${slice} fill`,
    borderImageWidth: `${slice}px`,
    borderImageRepeat: 'stretch',
  };
}
