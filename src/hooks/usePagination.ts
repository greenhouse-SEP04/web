import { useState, useMemo, useEffect } from "react";

/**
 * Generic, client-side paginator.
 *
 * @param items        Full list to paginate
 * @param rowsPerPage  How many rows to show on one page
 * @returns helpers (`page`, `setPage`, `totalPages`, `pageData`)
 */
export function usePagination<T>(items: T[], rowsPerPage: number) {
  const [page, setPage] = useState(1);

  // ─── derived values ──────────────────────────────────────────────
  const totalPages = useMemo(
    () => Math.max(Math.ceil(items.length / rowsPerPage), 1),
    [items.length, rowsPerPage],
  );

  const pageData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  // ─── side-effects ────────────────────────────────────────────────
  // When the item list changes (e.g. fresh fetch or filter), reset
  // back to page 1 so the user never lands on an empty page.
  useEffect(() => {
    setPage(1);
  }, [items]);

  return { page, setPage, totalPages, pageData };
}
