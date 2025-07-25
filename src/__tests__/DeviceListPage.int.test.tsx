import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DeviceListPage from "@/pages/DeviceListPage";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";

/* ───────────────────────── MSW handlers ───────────────────────── */
const devices = [
  { mac: "AA", name: "Sensor-A", ownerId: null, ownerUserName: null },
  { mac: "BB", name: "Sensor-B", ownerId: null, ownerUserName: null },
];

const server = setupServer(
  http.get("*/device", () => HttpResponse.json(devices)),
  http.get("*/telemetry/:mac/range", () =>
    HttpResponse.json({ first: null, last: null, online: true }),
  ),
  http.get("*/users", () => HttpResponse.json([])),
);

/* ───────────────────────── Mock Auth ctx ────────────────────────
   DeviceListPage relies on useAuth() to provide a user before it
   triggers its data-loading effect. We stub the hook to pretend an
   Admin user is logged in. */
vi.mock("@/context/AuthContext", () => {
  return {
    /* eslint-disable react-hooks/rules-of-hooks */
    useAuth: () => ({
      authed: true,
      user: { id: "1", userName: "admin", roles: ["Admin"] },
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
    }),
  };
});

/* ───────────────────────── Test setup/teardown ────────────────── */
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/* ───────────────────────────── Test ───────────────────────────── */
it("renders list after loader", async () => {
  render(
    <MemoryRouter>
      <DeviceListPage />
    </MemoryRouter>,
  );

  // Loader shows immediately
  expect(screen.getByTestId("loader")).toBeInTheDocument();

  // Device cards appear once MSW responds and loading flag drops
  await waitFor(() => {
    expect(screen.getByText("Sensor-A")).toBeInTheDocument();
    expect(screen.getByText("Sensor-B")).toBeInTheDocument();
  });
});
