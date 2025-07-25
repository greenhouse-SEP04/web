import { renderHook, act } from "@testing-library/react";
import { usePagination } from "@/hooks/usePagination";
import { expect, it } from "vitest";

it("computes pages, handles navigation and resets when list changes", () => {
  // initial list of 5 items, 2 rows per page → 3 pages
  const { result, rerender } = renderHook(
    ({ items }) => usePagination(items, 2),
    { initialProps: { items: [1, 2, 3, 4, 5] } },
  );

  // page 1 on mount
  expect(result.current.page).toBe(1);
  expect(result.current.totalPages).toBe(3);
  expect(result.current.pageData).toEqual([1, 2]);

  // switch to page 2
  act(() => result.current.setPage(2));
  expect(result.current.pageData).toEqual([3, 4]);

  // rerender with a **shorter** list → hook should jump back to page 1
  rerender({ items: [1, 2] });
  expect(result.current.page).toBe(1);
  expect(result.current.totalPages).toBe(1);
  expect(result.current.pageData).toEqual([1, 2]);
});
