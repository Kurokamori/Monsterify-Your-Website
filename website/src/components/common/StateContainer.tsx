import { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

type State = 'loading' | 'error' | 'empty' | 'success';

interface StateContainerProps {
  /** Current state */
  state: State;
  /** Content to render on success */
  children: ReactNode;
  /** Loading message */
  loadingMessage?: string;
  /** Error message or Error object */
  error?: string | Error | null;
  /** Retry handler for error state */
  onRetry?: () => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon (FontAwesome class) */
  emptyIcon?: string;
  /** Custom empty state content */
  emptyContent?: ReactNode;
  /** Custom loading content */
  loadingContent?: ReactNode;
  /** Custom error content */
  errorContent?: ReactNode;
  /** Minimum height for container */
  minHeight?: string;
  /** Center content vertically */
  centered?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * StateContainer - Wrapper component for handling loading/error/empty/success states
 * Provides consistent UI patterns for async data fetching scenarios
 */
export const StateContainer = ({
  state,
  children,
  loadingMessage = 'Loading...',
  error,
  onRetry,
  emptyMessage = 'No data available',
  emptyIcon = 'fas fa-inbox',
  emptyContent,
  loadingContent,
  errorContent,
  minHeight,
  centered = true,
  className = ''
}: StateContainerProps) => {
  const containerClasses = [
    'state-container',
    centered && 'state-container--centered',
    className
  ].filter(Boolean).join(' ');

  const containerStyle = minHeight ? { minHeight } : undefined;

  // Loading state
  if (state === 'loading') {
    if (loadingContent) {
      return (
        <div className={containerClasses} style={containerStyle}>
          {loadingContent}
        </div>
      );
    }

    return (
      <div className={containerClasses} style={containerStyle}>
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    if (errorContent) {
      return (
        <div className={containerClasses} style={containerStyle}>
          {errorContent}
        </div>
      );
    }

    const errorMsg = error instanceof Error ? error.message : (error || 'An error occurred');

    return (
      <div className={containerClasses} style={containerStyle}>
        <ErrorMessage message={errorMsg} onRetry={onRetry} />
      </div>
    );
  }

  // Empty state
  if (state === 'empty') {
    if (emptyContent) {
      return (
        <div className={containerClasses} style={containerStyle}>
          {emptyContent}
        </div>
      );
    }

    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="state-container__empty">
          <i className={`${emptyIcon} state-container__empty-icon`}></i>
          <p className="state-container__empty-message">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Success state - render children
  return <>{children}</>;
};

interface AutoStateContainerProps {
  /** Is data loading? */
  loading: boolean;
  /** Error message or Error object */
  error?: string | Error | null;
  /** Data array - used to determine empty state */
  data?: unknown[] | null;
  /** Override empty state detection */
  isEmpty?: boolean;
  /** Content to render on success */
  children: ReactNode;
  /** Loading message */
  loadingMessage?: string;
  /** Retry handler for error state */
  onRetry?: () => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon (FontAwesome class) */
  emptyIcon?: string;
  /** Custom empty state content */
  emptyContent?: ReactNode;
  /** Custom loading content */
  loadingContent?: ReactNode;
  /** Custom error content */
  errorContent?: ReactNode;
  /** Minimum height for container */
  minHeight?: string;
  /** Center content vertically */
  centered?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * AutoStateContainer - Automatically determines state based on loading/error/data props
 * Convenience wrapper around StateContainer
 */
export const AutoStateContainer = ({
  loading,
  error,
  data,
  isEmpty,
  children,
  ...rest
}: AutoStateContainerProps) => {
  // Determine state
  let state: State = 'success';
  if (loading) {
    state = 'loading';
  } else if (error) {
    state = 'error';
  } else if (isEmpty !== undefined) {
    state = isEmpty ? 'empty' : 'success';
  } else if (Array.isArray(data)) {
    state = data.length === 0 ? 'empty' : 'success';
  }

  return (
    <StateContainer state={state} error={error} {...rest}>
      {children}
    </StateContainer>
  );
};
