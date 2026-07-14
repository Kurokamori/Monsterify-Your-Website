import { useState } from 'react';

/**
 * A trainer standing on the field. Always mounted (so it can slide *out* as well as
 * in) and toggled purely by the `visible` flag; the slide itself is a CSS transition.
 * A portrait whose art fails to load unmounts itself rather than falling back to a
 * monster placeholder.
 */
export function TrainerPortrait({
  image,
  name,
  side,
  visible,
}: {
  image: string;
  name: string;
  side: 'enemy' | 'player';
  visible: boolean;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <img
      className={`battle-field__trainer battle-field__trainer--${side} ${visible ? 'battle-field__trainer--in' : ''}`}
      src={image}
      alt={name}
      aria-hidden={!visible}
      onError={() => setBroken(true)}
    />
  );
}
