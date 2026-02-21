interface BackButtonConfig {
  onClick: () => void;
  text: string;
}

export interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  backButton?: BackButtonConfig;
}

export function ErrorMessage({
  message = 'An error occurred. Please try again later.',
  onRetry,
  onDismiss,
  backButton,
}: ErrorMessageProps) {
  return (
    <div className="error-container">
      <i className="fa-solid fa-exclamation-circle" />
      <p className="alert error">{message}</p>
      {(onRetry || onDismiss || backButton) && (
        <div className="container center gap-small">
          {onRetry && (
            <button onClick={onRetry} className="button primary">
              <i className="fa-solid fa-redo" /> Try Again
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="button secondary">
              <i className="fa-solid fa-times" /> Dismiss
            </button>
          )}
          {backButton && (
            <button onClick={backButton.onClick} className="button secondary">
              <i className="fa-solid fa-arrow-left" /> {backButton.text}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
