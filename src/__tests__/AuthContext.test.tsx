// AuthContext.test.tsx
import { expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// stub API + jwtDecode
vi.mock("@/services/api", () => ({
  login: vi.fn().mockResolvedValue("JWT"),
  logout: vi.fn(),
  bootstrapAuth: vi.fn(),
  setAuthToken: vi.fn(),
  listUsers: vi.fn().mockResolvedValue([]),
  resetOwnPassword: vi.fn(),
}));
vi.mock("jwt-decode", () => ({
  jwtDecode: () => ({ sub: "1", role: "User" }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

it("login fills user & logout clears", async () => {
  const { result } = renderHook(() => useAuth(), { wrapper });

  await act(() => result.current.login("john", "pw"));
  expect(result.current.authed).toBe(true);
  expect(result.current.user?.userName).toBe("john");

  act(() => result.current.logout());
  expect(result.current.authed).toBe(false);
});
