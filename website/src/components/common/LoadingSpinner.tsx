interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'lg' | 'small' | 'large' | '';
}

export function LoadingSpinner({
  message = 'Loading...',
  size = '',
}: LoadingSpinnerProps) {
  // Normalize size aliases
  const normalizedSize = size === 'small' ? 'sm' : size === 'large' ? 'lg' : size;

  return (
    <div className="spinner-container">
      <div className={`spinner-dots${normalizedSize ? ` ${normalizedSize}` : ''}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="spinner-dot" />
        ))}
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
}
