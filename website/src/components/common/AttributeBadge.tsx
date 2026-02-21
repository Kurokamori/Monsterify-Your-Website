type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface AttributeBadgeProps {
  /** The attribute name (e.g., 'virus', 'vaccine', 'data', 'free') */
  attribute: string;
  /** Badge size */
  size?: BadgeSize;
  /** Show full width */
  fullWidth?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * AttributeBadge - Displays a monster attribute with appropriate color styling
 * Uses CSS variables defined in themes.css for attribute colors
 */
export const AttributeBadge = ({
  attribute,
  size = 'sm',
  fullWidth = false,
  className = ''
}: AttributeBadgeProps) => {
  if (!attribute) return null;

  const formattedAttribute = attribute.toLowerCase().trim();

  const classes = [
    'badge',
    'badge--attribute',
    `attribute-${formattedAttribute}`,
    size,
    fullWidth && 'full-width',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {attribute}
    </span>
  );
};
