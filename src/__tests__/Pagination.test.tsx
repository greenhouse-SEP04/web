import { render, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { Pagination } from "@/components/Pagination";

describe("<Pagination>", () => {
  it("disables prev on first page & calls onPageChange", () => {
    const onChange = vi.fn();

    const { getByRole, getByText } = render(
      <Pagination page={1} totalPages={3} onPageChange={onChange} />,
    );

    // “Previous page” button is disabled on page 1
    expect(getByRole("button", { name: /previous page/i })).toBeDisabled();

    // Click “Next page” and expect handler to be called with the new page index
    fireEvent.click(getByRole("button", { name: /next page/i }));
    expect(onChange).toHaveBeenCalledWith(2);

    // Counter text is rendered as expected
    expect(getByText("Page 1 / 3")).toBeInTheDocument();
  });
});

it('disables next on last page', () => {
  const { getByRole } = render(<Pagination page={3} totalPages={3} onPageChange={() => {}} />);
  expect(getByRole('button', { name: /next page/i })).toBeDisabled();
});
