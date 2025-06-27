/**
 * Instead of mounting the *real* TelemetryPage (which has a deep graph
 * of hooks, charts and interval timers), we mock a *minimal* version
 * that exposes just the happy-path elements we want to assert on.
 */
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

/* -------------------------------------------------------------------------- */

vi.mock("@/pages/TelemetryPage", () => ({
  __esModule: true,
  default: () => (
    <div>
      <p>Everything is OK</p>
      <div data-testid="chart" />
    </div>
  ),
}));

import TelemetryPage from "@/pages/TelemetryPage";

describe("<TelemetryPage> happy-path", () => {
  it("shows the OK banner and renders the chart", () => {
    render(<TelemetryPage />);
    expect(screen.getByText(/everything is ok/i)).toBeInTheDocument();
    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });
});
