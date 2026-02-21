import { ReactNode, useCallback, useEffect } from 'react';
import { Modal } from './Modal';
import { ActionButtonGroup } from './ActionButtonGroup';

type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

interface InfoSection {
  /** Section title */
  title?: string;
  /** Section content */
  content: ReactNode;
  /** Icon for section header */
  icon?: string;
}

interface InfoModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Subtitle or category */
  subtitle?: string;
  /** Main image URL */
  image?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Badge content (e.g., rarity) */
  badge?: ReactNode;
  /** Main description text */
  description?: ReactNode;
  /** Structured sections */
  sections?: InfoSection[];
  /** Key-value metadata pairs */
  metadata?: Array<{ label: string; value: ReactNode }>;
  /** Footer content or actions */
  footer?: ReactNode;
  /** Primary action button */
  primaryAction?: {
    label: string;
    icon?: string;
    onClick: () => void;
    disabled?: boolean;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    icon?: string;
    onClick: () => void;
    disabled?: boolean;
  };
  /** Modal size */
  size?: ModalSize;
  /** Enable keyboard navigation (arrow keys) */
  enableNavigation?: boolean;
  /** Has next item */
  hasNext?: boolean;
  /** Has previous item */
  hasPrev?: boolean;
  /** Navigate to next */
  onNext?: () => void;
  /** Navigate to previous */
  onPrev?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * InfoModal - Modal for displaying structured information
 * Great for item details, entity info, previews, etc.
 */
export const InfoModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  image,
  imageAlt,
  badge,
  description,
  sections,
  metadata,
  footer,
  primaryAction,
  secondaryAction,
  size = 'medium',
  enableNavigation = false,
  hasNext = false,
  hasPrev = false,
  onNext,
  onPrev,
  className = ''
}: InfoModalProps) => {
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !enableNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, enableNavigation, hasNext, hasPrev, onNext, onPrev]);

  const renderFooter = useCallback(() => {
    if (footer) return footer;

    if (!primaryAction && !secondaryAction) return null;

    return (
      <ActionButtonGroup align="end" gap="sm">
        {secondaryAction && (
          <button
            type="button"
            className="button secondary"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.icon && <i className={secondaryAction.icon}></i>}
            <span>{secondaryAction.label}</span>
          </button>
        )}
        {primaryAction && (
          <button
            type="button"
            className="button primary"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.icon && <i className={primaryAction.icon}></i>}
            <span>{primaryAction.label}</span>
          </button>
        )}
      </ActionButtonGroup>
    );
  }, [footer, primaryAction, secondaryAction]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={renderFooter()}
      size={size}
    >
      <div className={`info-modal ${className}`}>
        {/* Navigation buttons */}
        {enableNavigation && (
          <>
            {hasPrev && onPrev && (
              <button
                type="button"
                className="info-modal__nav info-modal__nav--prev"
                onClick={onPrev}
                aria-label="Previous"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
            )}
            {hasNext && onNext && (
              <button
                type="button"
                className="info-modal__nav info-modal__nav--next"
                onClick={onNext}
                aria-label="Next"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            )}
          </>
        )}

        {/* Header with image */}
        {(image || subtitle || badge) && (
          <div className="info-modal__header">
            {image && (
              <div className="info-modal__image-container">
                <img
                  src={image}
                  alt={imageAlt || title || 'Image'}
                  className="info-modal__image"
                />
                {badge && (
                  <div className="info-modal__badge">{badge}</div>
                )}
              </div>
            )}
            {subtitle && (
              <span className="info-modal__subtitle">{subtitle}</span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="info-modal__description">
            {typeof description === 'string' ? <p>{description}</p> : description}
          </div>
        )}

        {/* Metadata */}
        {metadata && metadata.length > 0 && (
          <div className="info-modal__metadata">
            {metadata.map((item, index) => (
              <div key={index} className="info-modal__metadata-item">
                <span className="info-modal__metadata-label">{item.label}</span>
                <span className="info-modal__metadata-value">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sections */}
        {sections && sections.length > 0 && (
          <div className="info-modal__sections">
            {sections.map((section, index) => (
              <div key={index} className="info-modal__section">
                {section.title && (
                  <h4 className="info-modal__section-title">
                    {section.icon && <i className={section.icon}></i>}
                    <span>{section.title}</span>
                  </h4>
                )}
                <div className="info-modal__section-content">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation hint */}
        {enableNavigation && (hasPrev || hasNext) && (
          <div className="info-modal__nav-hint">
            <span><kbd>←</kbd> <kbd>→</kbd> to navigate</span>
            <span><kbd>Esc</kbd> to close</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * Convenience component for item detail display
 */
interface ItemInfoModalProps extends Omit<InfoModalProps, 'metadata'> {
  /** Item category */
  category?: string;
  /** Item rarity */
  rarity?: string;
  /** Item effect text */
  effect?: string;
  /** Item quantity */
  quantity?: number;
}

export const ItemInfoModal = ({
  category,
  rarity,
  effect,
  quantity,
  ...props
}: ItemInfoModalProps) => {
  const metadata: Array<{ label: string; value: ReactNode }> = [];

  if (category) {
    metadata.push({ label: 'Category', value: category });
  }
  if (rarity) {
    metadata.push({
      label: 'Rarity',
      value: <span className={`badge ${rarity.toLowerCase()} sm`}>{rarity}</span>
    });
  }
  if (quantity !== undefined) {
    metadata.push({ label: 'Quantity', value: quantity.toLocaleString() });
  }

  const sections: InfoSection[] = [];
  if (effect) {
    sections.push({
      title: 'Effect',
      icon: 'fas fa-magic',
      content: <p>{effect}</p>
    });
  }

  return (
    <InfoModal
      {...props}
      metadata={metadata.length > 0 ? metadata : undefined}
      sections={sections.length > 0 ? sections : props.sections}
    />
  );
};
