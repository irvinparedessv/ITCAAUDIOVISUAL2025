import React from "react";
import Pagination from "react-bootstrap/Pagination";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const PaginationComponent: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }

    return pages;
  };

  return (
    <Pagination className="justify-content-center">
      <Pagination.Prev
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      />

      {generatePageNumbers().map((p, index) =>
        p === "..." ? (
          <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />
        ) : (
          <Pagination.Item
            key={p}
            active={p === page}
            onClick={() => onPageChange(Number(p))}
          >
            {p}
          </Pagination.Item>
        )
      )}

      <Pagination.Next
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      />
    </Pagination>
  );
};

export default PaginationComponent;
