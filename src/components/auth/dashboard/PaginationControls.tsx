import { PaginationMeta } from "../../../types/pagination.types";

interface PaginationControlsProps {
  pagination: PaginationMeta;
  itemLabel: string;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const PaginationControls = ({ pagination, itemLabel, onPageChange, disabled = false }: PaginationControlsProps) => {
  const totalPages = Math.max(1, pagination.totalPages);
  const firstItem = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  return (
    <nav className="pagination-controls" aria-label={`${itemLabel} pagination`}>
      <p>{firstItem}-{lastItem} of {pagination.totalItems} {itemLabel}{pagination.totalItems === 1 ? "" : "s"}</p>
      <div>
        <button type="button" className="secondary-button" disabled={disabled || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}>Previous</button>
        <span>Page {pagination.page} of {totalPages}</span>
        <button type="button" className="secondary-button" disabled={disabled || pagination.page >= totalPages}
          onClick={() => onPageChange(pagination.page + 1)}>Next</button>
      </div>
    </nav>
  );
};

export default PaginationControls;
