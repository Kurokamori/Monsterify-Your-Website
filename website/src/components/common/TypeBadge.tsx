type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface TypeBadgeProps {
  /** The type name (e.g., 'fire', 'water', 'electric') */
  type: string;
  /** Badge size */
  size?: BadgeSize;
  /** Show full width */
  fullWidth?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * TypeBadge - Displays a monster type with appropriate color styling
 * Uses CSS variables defined in themes.css for type colors
 */
export const TypeBadge = ({
  type,
  size = 'sm',
  fullWidth = false,
  className = ''
}: TypeBadgeProps) => {
  if (!type) return null;

  const formattedType = type.toLowerCase().trim();

  const classes = [
    'badge',
    'badge--type',
    `type-${formattedType}`,
    size,
    fullWidth && 'full-width',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {type}
    </span>
  );
};
