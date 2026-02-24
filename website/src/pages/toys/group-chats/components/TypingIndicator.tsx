import type { TypingUser } from '../types';

interface TypingIndicatorProps {
  typers: TypingUser[];
  currentTrainerId: number;
}

const TypingIndicator = ({ typers, currentTrainerId }: TypingIndicatorProps) => {
  const filtered = typers.filter((t) => t.trainer_id !== currentTrainerId);

  if (filtered.length === 0) return null;

  const text =
    filtered.length === 1
      ? `${filtered[0]!.nickname} is typing`
      : filtered.length === 2
        ? `${filtered[0]!.nickname} and ${filtered[1]!.nickname} are typing`
        : `${filtered[0]!.nickname} and ${filtered.length - 1} others are typing`;

  return (
    <div className="typing-indicator">
      <span className="typing-indicator__text">{text}</span>
      <span className="typing-indicator__dots">
        <span className="typing-indicator__dot"></span>
        <span className="typing-indicator__dot"></span>
        <span className="typing-indicator__dot"></span>
      </span>
    </div>
  );
};

export default TypingIndicator;
