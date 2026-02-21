import { ReactNode } from 'react';

type Alignment = 'start' | 'center' | 'end';

interface BadgeGroupProps {
  /** Badge elements */
  children: ReactNode;
  /** Alignment */
  align?: Alignment;
  /** Gap size */
  gap?: 'xs' | 'sm' | 'md';
  /** Wrap badges on overflow */
  wrap?: boolean;
  /** Stack vertically */
  vertical?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * BadgeGroup - Container for grouping multiple badges
 * Provides consistent spacing and layout
 */
export const BadgeGroup = ({
  children,
  align = 'start',
  gap = 'xs',
  wrap = true,
  vertical = false,
  className = ''
}: BadgeGroupProps) => {
  const classes = [
    'badge-group',
    `badge-group--align-${align}`,
    `badge-group--gap-${gap}`,
    wrap && 'badge-group--wrap',
    vertical && 'badge-group--vertical',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};
