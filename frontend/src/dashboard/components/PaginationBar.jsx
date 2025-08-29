import React from 'react';

/**
 * PaginationBar
 * Props:
 * - page: number
 * - totalPages: number
 * - onPrev: () => void
 * - onNext: () => void
 * - renderStatus?: (page, totalPages) => React.ReactNode
 * - classes: { bar, btn, btnDisabled, status }
 */

export default function PaginationBar({ page = 1, totalPages = 1, onPrev, onNext, renderStatus, classes = {} }) {
  const { bar = '', btn = '', btnDisabled = '', status = '' } = classes || {};
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className={bar}>
      <PaginationButton
        onClick={onPrev}
        disabled={prevDisabled}
        className={`${btn} ${prevDisabled ? btnDisabled : ''}`}
      >
        Previous
      </PaginationButton>
      <div className={status}>
        {renderStatus ? renderStatus(page, totalPages) : `Page ${page} of ${totalPages}`}
      </div>
      <PaginationButton
        onClick={onNext}
        disabled={nextDisabled}
        className={`${btn} ${nextDisabled ? btnDisabled : ''}`}
      >
        Next
      </PaginationButton>
    </div>
  );
}


// Abstracted PaginationButton component
function PaginationButton({ children, onClick, disabled, className }) {
  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
