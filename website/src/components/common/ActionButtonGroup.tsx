import { ReactNode } from 'react';

type Alignment = 'start' | 'center' | 'end' | 'between' | 'stretch';
type Direction = 'row' | 'column';

interface ActionButtonGroupProps {
  /** Button elements */
  children: ReactNode;
  /** Horizontal alignment */
  align?: Alignment;
  /** Layout direction */
  direction?: Direction;
  /** Gap size between buttons */
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  /** Full width buttons */
  fullWidth?: boolean;
  /** Reverse order */
  reverse?: boolean;
  /** Wrap buttons on overflow */
  wrap?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * ActionButtonGroup - Consistent button grouping for forms and modals
 * Provides proper spacing, alignment, and responsive behavior
 */
export const ActionButtonGroup = ({
  children,
  align = 'end',
  direction = 'row',
  gap = 'sm',
  fullWidth = false,
  reverse = false,
  wrap = false,
  className = ''
}: ActionButtonGroupProps) => {
  const classes = [
    'action-button-group',
    `action-button-group--${direction}`,
    `action-button-group--align-${align}`,
    `action-button-group--gap-${gap}`,
    fullWidth && 'action-button-group--full-width',
    reverse && 'action-button-group--reverse',
    wrap && 'action-button-group--wrap',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};
