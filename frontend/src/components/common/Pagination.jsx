import React from "react";

const Pagination = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  siblingCount = 1,
}) => {
  if (totalItems === 0) {
    return null;
  }

  const totalPages = Math.ceil(totalItems / pageSize);
  const showNavigation = totalPages > 1;

  const range = showNavigation
    ? createPaginationRange({ currentPage, totalPages, siblingCount })
    : [];
  const firstIndex = (currentPage - 1) * pageSize + 1;
  const lastIndex = Math.min(currentPage * pageSize, totalItems);

  const handleChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  return (
    <div className="flex flex-col gap-3 border-t border-emerald-50 bg-white p-4 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-emerald-600">
        Showing {firstIndex}–{lastIndex} of {totalItems}
      </p>
      {showNavigation ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleChange(currentPage - 1)}
            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-emerald-100 disabled:text-emerald-300"
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {range.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-xs font-semibold text-emerald-400"
                >
                  …
                </span>
              );
            }

            const pageNumber = item;
            const isActive = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => handleChange(pageNumber)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-emerald-500 text-white shadow"
                    : "border border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleChange(currentPage + 1)}
            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-emerald-100 disabled:text-emerald-300"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

const createPaginationRange = ({ currentPage, totalPages, siblingCount }) => {
  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPageNumbers >= totalPages) {
    return range(1, totalPages);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = range(1, totalPageNumbers - 2);
    return [...leftRange, "ellipsis", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = range(totalPages - (totalPageNumbers - 3), totalPages);
    return [1, "ellipsis", ...rightRange];
  }

  const middleRange = range(leftSiblingIndex, rightSiblingIndex);

  return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
};

export default Pagination;
