// src/__tests__/SettingsPage.test.tsx
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } 
  from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

/* hoisted fn so vi.mock can reference it safely */
const updateSettingsMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/api", () => ({
  listDevices: vi.fn().mockResolvedValue([{ mac: "AA:BB:CC", name: "Greenhouse 1" }]),
  getSettings: vi.fn().mockResolvedValue({
    watering: { manual: false, soilMin: 40, soilMax: 60 },
    vent    : { manual: false, humLo: 45, humHi: 60 },
    security: { armed: false, alarmWindow: { start: "22:00", end: "06:00" } },
  }),
  updateSettings: updateSettingsMock,
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    authed: true,
    user: { id: "1", userName: "admin", roles: ["Admin"] },
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  }),
}));

import SettingsPage from "@/pages/SettingsPage";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/settings/:mac" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>
  );

describe("<SettingsPage>", () => {
  beforeEach(() => updateSettingsMock.mockClear());

  it("blocks save when humidity low is out of range", async () => {
    renderAt("/settings/AA%3ABB%3ACC");

    // Wait for the full-page loader to go away (devices fetch)
    await waitForElementToBeRemoved(() => screen.getByTestId("loader"), { timeout: 3000 });

    // Now settings spinner may render – if so, wait for that one too
    // (wrapped in try so we don't fail if it's already gone)
    try {
      await waitForElementToBeRemoved(() => screen.getByTestId("loader"), { timeout: 3000 });
    } catch {
      /* loader may already be gone — that's fine */
    }

    // Grab the input via its <label> text
    const humLo = await screen.findByLabelText(/low humidity/i);
    fireEvent.change(humLo, { target: { value: "30" } }); // invalid (<35)

    const saveBtn = await screen.findByRole("button", { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSettingsMock).not.toHaveBeenCalled();
    });
  });
});
