interface SuccessMessageProps {
  title?: string;
  message: string;
  onClose?: () => void;
}

export function SuccessMessage({ title, message, onClose }: SuccessMessageProps) {
  return (
    <div className="alert success message-box">
      <div className="message-icon">
        <i className="fa-solid fa-check-circle" />
      </div>
      <div className="message-content">
        {title && <h3 className="message-title">{title}</h3>}
        <p className="message-text">{message}</p>
      </div>
      {onClose && (
        <button className="button close no-flex" onClick={onClose} aria-label="Close">
          &times;
        </button>
      )}
    </div>
  );
}
