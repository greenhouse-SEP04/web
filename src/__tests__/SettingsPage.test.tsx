// D:\source\SEP04_greenhouse\web\src\__tests__\SettingsPage.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

// stub the service-layer to match the new component
const updateSettingsMock = vi.fn();

vi.mock("@/services/api", () => ({
  listDevices: vi.fn().mockResolvedValue([
    { mac: "AA:BB:CC", name: "Greenhouse 1", ownerId: null, ownerUserName: null },
  ]),
  getSettings: vi.fn().mockResolvedValue({
    watering: { manual: false, soilMin: 40, soilMax: 60 },
    vent:     { manual: false, humLo: 45, humHi: 60 },
    security: { armed: false, alarmWindow: { start: "22:00", end: "06:00" } },
  }),
  updateSettings: updateSettingsMock,
}));

import SettingsPage from "@/pages/SettingsPage";

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={["/settings/AA:BB:CC"]}>
      <SettingsPage />
    </MemoryRouter>,
  );

describe("<SettingsPage>", () => {
  beforeEach(() => updateSettingsMock.mockClear());

  it("blocks save when Soil Min is out of range", async () => {
    renderWithRouter();

    // wait for settings to load
    const soilMin = await screen.findByLabelText(/soil min/i);

    // set an invalid value (below 20)
    fireEvent.change(soilMin, { target: { value: "10" } });

    // attempt save
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    // expect the API not to be called due to validation failure
    await waitFor(() => {
      expect(updateSettingsMock).not.toHaveBeenCalled();
    });
  });
});
