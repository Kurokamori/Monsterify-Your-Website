import { ReactNode, MouseEvent, createElement } from 'react';

type CardVariant = 'default' | 'compact' | 'flat';
type CardSize = 'sm' | 'md' | 'lg';

interface CardAction {
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  disabled?: boolean;
}

export interface CardProps {
  /** Card content */
  children?: ReactNode;
  /** Header title */
  title?: ReactNode;
  /** Header subtitle */
  subtitle?: ReactNode;
  /** Header right-side content (badges, icons, etc.) */
  headerAction?: ReactNode;
  /** Image source URL */
  image?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Image position */
  imagePosition?: 'top' | 'left' | 'right' | 'background';
  /** Image height (for top position) */
  imageHeight?: string;
  /** Fallback image on error */
  imageFallback?: string;
  /** Overlay content rendered on top of the image (bottom-right) */
  imageOverlay?: ReactNode;
  /** Footer content (custom) */
  footer?: ReactNode;
  /** Footer action buttons */
  actions?: CardAction[];
  /** Card visual variant */
  variant?: CardVariant;
  /** Card size */
  size?: CardSize;
  /** Selected state */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Hoverable state (adds hover effect) */
  hoverable?: boolean;
  /** Clickable card */
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  /** Link URL - renders as <a> to enable right-click/middle-click open in new tab */
  href?: string;
  /** Additional className */
  className?: string;
  /** Full height mode */
  fullHeight?: boolean;
}

export const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  image,
  imageAlt = '',
  imagePosition = 'top',
  imageHeight = '180px',
  imageFallback = '/images/default.png',
  imageOverlay,
  footer,
  actions,
  variant = 'default',
  size = 'md',
  selected = false,
  disabled = false,
  hoverable = false,
  onClick,
  href,
  className = '',
  fullHeight = false
}: CardProps) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== imageFallback) {
      target.src = imageFallback;
    }
  };

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (disabled || !onClick) return;
    if (href) e.preventDefault();
    onClick(e);
  };

  const cardClasses = [
    'card',
    `card--${variant}`,
    `card--${size}`,
    selected && 'card--selected',
    disabled && 'card--disabled',
    (hoverable || onClick) && 'card--clickable',
    fullHeight && 'card--full-height',
    imagePosition === 'left' && 'card--horizontal',
    imagePosition === 'right' && 'card--horizontal card--image-right',
    imagePosition === 'background' && 'card--background-image',
    className
  ].filter(Boolean).join(' ');

  const renderImage = () => {
    if (!image) return null;

    if (imagePosition === 'background') {
      return (
        <div
          className="card__background"
          style={{ backgroundImage: `url(${image})` }}
        />
      );
    }

    return (
      <div className="card__image" style={imagePosition === 'top' ? { height: imageHeight, position: 'relative' } : { position: 'relative' }}>
        <img
          src={image}
          alt={imageAlt}
          onError={handleImageError}
        />
        {imageOverlay && (
          <div className="card__image-overlay">{imageOverlay}</div>
        )}
      </div>
    );
  };

  const renderHeader = () => {
    if (!title && !subtitle && !headerAction) return null;

    return (
      <div className="card__header">
        <div className="card__header-content">
          {title && <h3 className="card__title">{title}</h3>}
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
        {headerAction && <div className="card__header-action">{headerAction}</div>}
      </div>
    );
  };

  const renderFooter = () => {
    if (!footer && !actions?.length) return null;

    return (
      <div className="card__footer">
        {footer}
        {actions && actions.length > 0 && (
          <div className="card__actions">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`button ${action.variant || 'secondary'} sm`}
                onClick={action.onClick}
                disabled={action.disabled || disabled}
              >
                {action.icon && <i className={action.icon}></i>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Tag = href ? 'a' : 'div';
  const tagProps = href ? { href } : {};

  return createElement(
    Tag,
    { className: cardClasses, onClick: handleClick, ...tagProps },
    <>
      {(imagePosition === 'top' || imagePosition === 'background') && renderImage()}

      <div className="card__content">
        {imagePosition === 'left' && renderImage()}

        <div className="card__body">
          {renderHeader()}
          {children && <div className="card__text">{children}</div>}
        </div>

        {imagePosition === 'right' && renderImage()}
      </div>

      {renderFooter()}

      {selected && <div className="card__selected-indicator" />}
    </>
  );
};
