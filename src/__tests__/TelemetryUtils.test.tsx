// TelemetryUtils.test.ts
import { describe, expect, it } from "vitest";
import { /* pull out helpers */ } from "@/pages/TelemetryPage";

/* ─────────────────────── helpers ─────────────────────── */
import { waterIcon, inWindow } from '@/utils/telemetry';

it("waterIcon maps % to emojis", () => {
  expect(waterIcon(80)).toBe("💧💧💧");
  expect(waterIcon(50)).toBe("💧💧");
  expect(waterIcon(25)).toBe("💧");
  expect(waterIcon(0)).toBe("—");
});

describe("inWindow()", () => {
  it("detects simple ranges", () => {
    expect(inWindow("12:00", "08:00", "18:00")).toBe(true);
    expect(inWindow("07:59", "08:00", "18:00")).toBe(false);
  });
  it("wrap-around windows (23-06)", () => {
    expect(inWindow("02:00", "23:00", "06:00")).toBe(true);
    expect(inWindow("22:00", "23:00", "06:00")).toBe(false);
  });
});
