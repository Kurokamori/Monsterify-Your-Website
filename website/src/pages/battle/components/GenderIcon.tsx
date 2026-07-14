/**
 * Icon + colour for each gender. Keyed by the lowercased backend value so a stray
 * "male" or "MALE" from older data still resolves.
 *
 * `Genderless` is the neutral case — the monster has no gender at all — and gets the
 * neuter sign. `Non-binary` is a gender, and gets the transgender/non-binary symbol
 * rather than being lumped in with "none".
 */
interface GenderStyle {
  /** Font Awesome class. */
  icon: string;
  /** Screen-reader / tooltip label. */
  label: string;
  /** Modifier appended to the base class, for colour. */
  modifier: string;
}

const GENDER_STYLES: Record<string, GenderStyle> = {
  male: { icon: 'fas fa-mars', label: 'Male', modifier: 'male' },
  female: { icon: 'fas fa-venus', label: 'Female', modifier: 'female' },
  'non-binary': { icon: 'fas fa-transgender', label: 'Non-binary', modifier: 'nonbinary' },
  genderless: { icon: 'fas fa-genderless', label: 'Genderless', modifier: 'genderless' },
};

/** An unrecognised but present value still gets an icon rather than vanishing. */
const UNKNOWN_STYLE: GenderStyle = {
  icon: 'fas fa-question',
  label: 'Unknown gender',
  modifier: 'unknown',
};

function resolveGenderStyle(gender: string | null | undefined): GenderStyle | null {
  const key = (gender ?? '').trim().toLowerCase();
  if (!key) return null;
  return GENDER_STYLES[key] ?? UNKNOWN_STYLE;
}

/**
 * The gender of a battling monster.
 *
 * Renders nothing when the gender is unset, which is the case for every battle started
 * before gender was frozen into the battle data, and for gym monsters whose author left
 * the field blank — an absent gender is shown as absent, not guessed at.
 */
export function GenderIcon({
  gender,
  className = '',
}: {
  gender: string | null | undefined;
  className?: string;
}) {
  const style = resolveGenderStyle(gender);
  if (!style) return null;

  return (
    <i
      className={`${style.icon} battle-gender battle-gender--${style.modifier} ${className}`.trim()}
      title={style.label}
      aria-label={style.label}
      role="img"
    />
  );
}
