import "@testing-library/jest-dom/vitest";
import {  vi } from "vitest";

// ⇢ Mock the toast lib once for all tests
vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: vi.fn(), error: vi.fn() },
}));

// ⇢ Silence React-Router warnings when using MemoryRouter
vi.mock("react-router-dom", async (orig: () => Promise<Record<string, unknown>>) => {
  const mod = await orig();
  return { ...mod, usePrompt: () => {} };
});