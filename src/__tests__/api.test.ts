import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/* --------------------------------------------------------------------------
   axios stub – declared *before* the vi.mock factory to avoid TDZ
--------------------------------------------------------------------------- */
const axiosStub = {
  defaults: {
    headers: {
      common: {} as Record<string, string>,
    },
  },
  post: vi.fn(),
  get : vi.fn(),
};

vi.mock("axios", () => ({
  default: {
    create      : () => axiosStub,   // returns the stub, never touches outer TDZ
    isAxiosError: () => false,
  },
}));

/* --------------------------------------------------------------------------
   real imports that depend on axios
--------------------------------------------------------------------------- */
import {
  setAuthToken,
  bootstrapAuth,
  login,
  listDevices,
} from "@/services/api";

/* --------------------------------------------------------------------------
   tests
--------------------------------------------------------------------------- */
describe("token helpers", () => {
  beforeEach(() => {
    axiosStub.defaults.headers.common = {};
    localStorage.clear();
  });

  it("setAuthToken stores token & header", () => {
    setAuthToken("JWT");
    expect(localStorage.getItem("jwt")).toBe("JWT");
    expect(axiosStub.defaults.headers.common.Authorization).toBe("Bearer JWT");
  });

  it("bootstrapAuth picks token from LS", () => {
    localStorage.setItem("jwt", "FOO");
    bootstrapAuth();
    expect(axiosStub.defaults.headers.common.Authorization).toBe("Bearer FOO");
  });
});

describe("login / device list", () => {
  beforeEach(() => {
    axiosStub.post.mockResolvedValue({ data: { token: "JWT" } });
    axiosStub.get .mockResolvedValue({ data: [] });
    axiosStub.defaults.headers.common = {};
    localStorage.clear();
  });

  afterEach(() => vi.resetAllMocks());

  it("persists token after login", async () => {
    await login("user", "pass");
    expect(localStorage.getItem("jwt")).toBe("JWT");
    expect(axiosStub.defaults.headers.common.Authorization).toBe("Bearer JWT");
  });

  it("retries once on 401 then succeeds", async () => {
    axiosStub.get
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValue({ data: [] });

    await expect(listDevices()).resolves.toEqual([]);
    expect(axiosStub.get).toHaveBeenCalledTimes(2);
  });
});
