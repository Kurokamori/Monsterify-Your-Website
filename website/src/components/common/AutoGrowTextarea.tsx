import { CSSProperties, TextareaHTMLAttributes, useLayoutEffect, useRef } from 'react';

interface AutoGrowTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

const supportsFieldSizing =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('field-sizing', 'content');

const baseStyle: CSSProperties = {
  display: 'block',
  flex: 'none',
  width: '100%',
  resize: 'none',
  overflow: 'hidden',
  ...(supportsFieldSizing ? ({ fieldSizing: 'content' } as unknown as CSSProperties) : null),
};

function fit(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  const borderHeight = el.offsetHeight - el.clientHeight;
  el.style.height = `${el.scrollHeight + borderHeight}px`;
}

export function AutoGrowTextarea({ minRows = 2, value, style, onChange, ...props }: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (supportsFieldSizing) {
      return;
    }
    if (ref.current) {
      fit(ref.current);
    }
  });

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!supportsFieldSizing) {
      fit(event.target);
    }
    onChange?.(event);
  };

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={handleChange}
      style={{ ...baseStyle, ...style }}
      {...props}
    />
  );
}
