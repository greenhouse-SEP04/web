// src/hooks/usePagination.ts
import { useState, useMemo, useEffect } from "react";

export function usePagination<T>(items: T[], rowsPerPage: number) {
  const [page, setPage] = useState(1);

  // Compute how many pages total
  const totalPages = useMemo(
    () => Math.max(Math.ceil(items.length / rowsPerPage), 1),
    [items.length, rowsPerPage]
  );

  // Slice out just the items for the current page
  const pageData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  // Whenever the underlying items change, reset back to page 1
  useEffect(() => {
    setPage(1);
  }, [items]);

  return { page, setPage, totalPages, pageData };
}
