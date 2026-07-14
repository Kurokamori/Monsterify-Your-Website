import { pixelatedClass, textboxSkinStyle } from '@utils/battleAssetStyles';
import { handleMonImgError } from '../battleMonsterUtils';

/**
 * Pokémon-style battle dialogue box. Shows one line at a time, advanced by the
 * parent (click anywhere on the box or press Space/Enter). Renders the speaker's
 * sprite (or a bespoke talking sprite) and, when a text-box skin asset is set,
 * frames the box with it as a nine-slice via CSS border-image.
 */
export function DialogueBox({
  lines,
  index,
  sprite,
  speaker,
  textboxUrl,
  textboxSlice,
  textboxPixelated,
  onAdvance,
}: {
  lines: string[];
  index: number;
  sprite: string | null;
  speaker: string;
  textboxUrl: string | null;
  textboxSlice: number | null;
  textboxPixelated: boolean;
  onAdvance: () => void;
}) {
  const boxStyle: React.CSSProperties = textboxSkinStyle(textboxUrl, textboxSlice);
  const isLast = index >= lines.length - 1;
  return (
    <div className="battle-dialogue">
      {sprite && (
        <div className="battle-dialogue__portrait">
          <img src={sprite} alt={speaker} onError={handleMonImgError} />
        </div>
      )}
      <button
        type="button"
        className={`battle-dialogue__box ${textboxUrl ? 'battle-dialogue__box--custom' : ''} ${textboxUrl ? pixelatedClass(textboxPixelated) : ''}`}
        style={boxStyle}
        onClick={onAdvance}
      >
        <span className="battle-dialogue__speaker">{speaker}</span>
        <p className="battle-dialogue__text">{lines[index]}</p>
        <span className="battle-dialogue__advance">
          {isLast ? (
            <>Click or press Space to continue <i className="fas fa-play" /></>
          ) : (
            <>Next <i className="fas fa-angle-double-down" /></>
          )}
        </span>
      </button>
    </div>
  );
}
