import React, { type JSX } from "react";
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
  const items: JSX.Element[] = [];
  for (let number = 1; number <= totalPages; number++) {
    items.push(
      <Pagination.Item
        key={number}
        active={number === page}
        onClick={() => onPageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }
  return <Pagination>{items}</Pagination>;
};

export default PaginationComponent;
