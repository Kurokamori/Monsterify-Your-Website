import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BattleMonster } from '@services/battleService';
import { MonsterDetailPanel } from './MonsterDetailPanel';

const PANEL_WIDTH = 260;
/** Space between the panel and the element it describes. */
const PANEL_GAP = 10;
/** Keep the panel this far inside the viewport edges. */
const VIEWPORT_MARGIN = 8;
/**
 * Assumed panel height, used to decide whether there is room below the anchor before the
 * panel has painted. It only has to be close enough to pick the right side on the first
 * frame — the real height is measured immediately after and the choice is revisited.
 */
const ASSUMED_PANEL_HEIGHT = 240;

interface PanelPosition {
  top: number;
  left: number;
}

/** Everything the caller spreads onto the element the panel describes. */
export interface HoverAnchorProps {
  ref: (element: HTMLElement | null) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  'aria-describedby': string | undefined;
}

/**
 * Reveals a monster's detail panel while its element is hovered or focused.
 *
 * Returns props to spread onto that element rather than wrapping it: both call sites —
 * the info cards and the bench buttons — are flex children whose layout an extra wrapper
 * div would disturb.
 *
 * The panel is portalled to the body and fixed-positioned, because the battlefield clips
 * its overflow to keep the background art inside its rounded frame, and a panel laid out
 * inside a card would be cut off by it.
 *
 * Focus opens it alongside hover, so it is reachable by keyboard — the bench buttons are
 * already tabbable, and the info cards are given a tabindex.
 */
export function useMonsterHoverPanel(monster: BattleMonster): {
  anchorProps: HoverAnchorProps;
  panel: React.ReactNode;
} {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  /**
   * Sit the panel below the anchor, flipping above it when there isn't room, and never
   * let it hang off either side of the viewport.
   */
  const place = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const height = panelRef.current?.offsetHeight || ASSUMED_PANEL_HEIGHT;

    const roomBelow = window.innerHeight - rect.bottom;
    const showAbove = roomBelow < height + PANEL_GAP && rect.top > roomBelow;
    const top = showAbove
      ? Math.max(VIEWPORT_MARGIN, rect.top - height - PANEL_GAP)
      : rect.bottom + PANEL_GAP;

    const centred = rect.left + rect.width / 2 - PANEL_WIDTH / 2;
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, centred),
      Math.max(VIEWPORT_MARGIN, window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN),
    );

    setPosition({ top, left });
  }, []);

  // Runs once against the assumed height, then again once the panel has a real one — so
  // a tall panel that would overflow the bottom settles onto the correct side. Re-runs
  // when the content that drives its height changes under an open panel.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place, monster.statusEffects.length, monster.statStages]);

  // The battlefield doesn't scroll but the page does, and the bench sits below the fold
  // on a short window — a panel pinned to fixed coordinates has to keep up.
  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, place]);

  const setAnchor = useCallback((element: HTMLElement | null) => {
    anchorRef.current = element;
  }, []);

  const anchorProps: HoverAnchorProps = {
    ref: setAnchor,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    'aria-describedby': open ? panelId : undefined,
  };

  const panel = open
    ? createPortal(
        <div
          ref={panelRef}
          className="battle-hover-panel__layer"
          style={{
            width: PANEL_WIDTH,
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            // Hidden for the frame before it has been placed, so it never flashes in the
            // top-left corner on its way to the anchor.
            visibility: position ? 'visible' : 'hidden',
          }}
        >
          <MonsterDetailPanel monster={monster} panelId={panelId} />
        </div>,
        document.body,
      )
    : null;

  return { anchorProps, panel };
}
