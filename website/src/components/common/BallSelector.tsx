import { useState, useEffect, useCallback } from 'react';
import itemsService, { type Item } from '@services/itemsService';

export interface BallInventoryEntry {
  name: string;
  quantity: number;
}

interface BallSelectorProps {
  selectedBall: string;
  onBallChange: (ballName: string) => void;
  disabled?: boolean;
  showWarning?: boolean;
  warningText?: string;
  compact?: boolean;
  /** When provided, only balls the trainer owns (quantity > 0) are selectable.
   *  If the trainer owns none, a Poke Ball fallback is shown with a currency cost note. */
  inventory?: BallInventoryEntry[];
}

const POKEBALL_COST = 600;

let cachedBalls: Item[] | null = null;

export function BallSelector({
  selectedBall,
  onBallChange,
  disabled = false,
  showWarning = false,
  warningText,
  compact = false,
  inventory,
}: BallSelectorProps) {
  const [allBalls, setAllBalls] = useState<Item[]>(cachedBalls ?? []);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (cachedBalls) return;
    itemsService.getBallItems().then((items) => {
      cachedBalls = items;
      setAllBalls(items);
    });
  }, []);

  // Build a map of owned ball names → quantities
  const ownedBalls = inventory
    ? new Map(inventory.filter(b => b.quantity > 0).map(b => [b.name, b.quantity]))
    : null;

  const hasNoBalls = ownedBalls !== null && ownedBalls.size === 0;

  // Filter to only balls the trainer owns (if inventory provided)
  // If they own none, show Poke Ball as the only option
  const selectableBalls = ownedBalls
    ? (hasNoBalls
        ? allBalls.filter(b => b.name === 'Poke Ball')
        : allBalls.filter(b => ownedBalls.has(b.name)))
    : allBalls;

  // Whether the currently selected ball is the cost-fallback Poke Ball
  const isFallbackPokeball = hasNoBalls && selectedBall === 'Poke Ball';

  const currentBall = allBalls.find((b) => b.name === selectedBall);

  const handleSelect = useCallback(
    (ballName: string) => {
      onBallChange(ballName);
      setIsOpen(false);
    },
    [onBallChange],
  );

  if (compact) {
    return (
      <div className="ball-selector ball-selector--compact">
        <div className="ball-selector__current" title={selectedBall}>
          {currentBall?.image_url && (
            <img
              src={currentBall.image_url}
              alt={selectedBall}
              className="ball-selector__icon"
            />
          )}
          <span className="ball-selector__name">{selectedBall || 'Poke Ball'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ball-selector">
      {showWarning && warningText && (
        <div className="ball-selector__warning">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{warningText}</span>
        </div>
      )}

      {isFallbackPokeball && (
        <div className="ball-selector__cost-notice">
          <i className="fas fa-coins"></i>
          <span>No balls in inventory. A Poke Ball will be purchased for <strong>{POKEBALL_COST} coins</strong> (can go negative).</span>
        </div>
      )}

      <div
        className={`ball-selector__current ball-selector__current--clickable ${disabled ? 'ball-selector__current--disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {currentBall?.image_url && (
          <img
            src={currentBall.image_url}
            alt={selectedBall}
            className="ball-selector__icon"
          />
        )}
        <span className="ball-selector__name">{selectedBall || 'Poke Ball'}</span>
        {!disabled && !hasNoBalls && (
          <button type="button" className="button primary sm ball-selector__change-btn">
            <i className="fas fa-exchange-alt"></i> Change Ball
          </button>
        )}
      </div>

      {isOpen && !disabled && !hasNoBalls && (
        <div className="ball-selector__dropdown">
          <div className="ball-selector__grid">
            {selectableBalls.map((ball) => {
              const qty = ownedBalls?.get(ball.name);
              return (
                <button
                  key={ball.id}
                  type="button"
                  className={`ball-selector__option ${ball.name === selectedBall ? 'ball-selector__option--selected' : ''}`}
                  onClick={() => handleSelect(ball.name)}
                >
                  {ball.image_url && (
                    <img
                      src={ball.image_url}
                      alt={ball.name}
                      className="ball-selector__option-icon"
                    />
                  )}
                  <span className="ball-selector__option-name">{ball.name}</span>
                  {qty !== undefined && (
                    <span className="ball-selector__option-qty">x{qty}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
