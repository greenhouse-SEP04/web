import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

/* --------------------------------------------------------------------------
   service-layer stub – declare first, reuse inside vi.mock
--------------------------------------------------------------------------- */
const saveSettingsMock = vi.fn();

vi.mock("@/services/api", () => ({
  listDevices : vi.fn().mockResolvedValue([
    { mac: "AA:BB:CC", name: "Greenhouse 1" },
  ]),
  getSettings : vi.fn().mockResolvedValue({ onHour: 9, offHour: 18 }),
  saveSettings: saveSettingsMock,       // reuse the already-declared stub
}));

/* --------------------------------------------------------------------------
   component under test
--------------------------------------------------------------------------- */
import SettingsPage from "@/pages/SettingsPage";

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={["/settings/AA:BB:CC"]}>
      <SettingsPage />
    </MemoryRouter>,
  );

/* --------------------------------------------------------------------------
   tests
--------------------------------------------------------------------------- */
describe("<SettingsPage>", () => {
  beforeEach(() => saveSettingsMock.mockClear());

  it("blocks save when on-hour > 23", async () => {
    renderWithRouter();

    const onHour = await screen.findByRole("spinbutton", { name: /on/i });

    fireEvent.change(onHour, { target: { value: "28" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onHour).toHaveAttribute("aria-invalid", "true");
      expect(saveSettingsMock).not.toHaveBeenCalled();
    });
  });
});
