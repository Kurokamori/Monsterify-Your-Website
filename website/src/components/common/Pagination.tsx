import { useState, useRef, useEffect } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
}

type PageItem = number | '...';

const DEFAULT_PER_PAGE_OPTIONS = [12, 24, 48, 96];

export const Pagination = ({ currentPage, totalPages, onPageChange, perPage, onPerPageChange, perPageOptions = DEFAULT_PER_PAGE_OPTIONS }: PaginationProps) => {
  const [jumpInput, setJumpInput] = useState<'left' | 'right' | null>(null);
  const [jumpValue, setJumpValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (jumpInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [jumpInput]);

  const handleJumpSubmit = () => {
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    setJumpInput(null);
    setJumpValue('');
  };

  const getPageNumbers = (): PageItem[] => {
    const pageNumbers: PageItem[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, maxPagesToShow - 1);
      } else if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - maxPagesToShow + 2);
      }

      if (start > 2) {
        pageNumbers.push('...');
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }

      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const hasPerPageSelector = perPage != null && onPerPageChange;

  if (totalPages <= 1 && !hasPerPageSelector) {
    return null;
  }

  if (totalPages <= 1 && hasPerPageSelector) {
    return (
      <div className="pagination-wrapper">
        <div className="pagination-per-page">
          <span className="pagination-per-page__label">per page:</span>
          <select
            className="select pagination-per-page__select"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
          >
            {perPageOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  const ellipsisPositions = getPageNumbers().reduce<('left' | 'right')[]>((acc, item) => {
    if (item === '...') acc.push(acc.length === 0 ? 'left' : 'right');
    return acc;
  }, []);

  let ellipsisIndex = 0;

  return (
    <div className="pagination-wrapper">
      <div className="pagination">
        <button
          className="button secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        {getPageNumbers().map((page) => {
          if (page === '...') {
            const position = ellipsisPositions[ellipsisIndex++] || 'left';
            const isOpen = jumpInput === position;

            if (isOpen) {
              return (
                <form
                  key={`ellipsis-${position}`}
                  className="pagination-jump"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJumpSubmit();
                  }}
                >
                  <input
                    ref={inputRef}
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpValue}
                    onChange={(e) => setJumpValue(e.target.value)}
                    onBlur={handleJumpSubmit}
                    placeholder="#"
                    className="pagination-jump-input"
                  />
                </form>
              );
            }

            return (
              <button
                key={`ellipsis-${position}`}
                className="button secondary pagination-ellipsis-btn"
                onClick={() => {
                  setJumpInput(position);
                  setJumpValue('');
                }}
                title="Jump to page..."
              >
                ...
              </button>
            );
          }

          return (
            <button
              key={page}
              className={`button secondary ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          );
        })}

        <button
          className="button secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {perPage != null && onPerPageChange && (
        <div className="pagination-per-page">
          <span className="pagination-per-page__label">per page:</span>
          <select
            className="select pagination-per-page__select"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
          >
            {perPageOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
