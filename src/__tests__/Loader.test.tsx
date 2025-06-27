import { render } from "@testing-library/react";
import Loader from "@/components/Loader";

it("applies correct Tailwind size classes", () => {
  const { getByTestId } = render(<Loader size={10} />);

  // the <div data-testid="loader"> is the wrapper; its firstChild is the spinner
  const spinner = getByTestId("loader").firstChild as HTMLElement;

  expect(spinner).toHaveClass("h-10", "w-10");
});

it('falls back to default size=8', () => {
  const { getByTestId } = render(<Loader />);
  const spinner = getByTestId('loader').firstChild as HTMLElement;
  expect(spinner).toHaveClass('h-8', 'w-8');
});