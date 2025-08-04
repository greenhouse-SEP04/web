// src/pages/SettingsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listDevices as getDevices,
  getSettings,
  updateSettings,
} from "@/services/api";
import type {
  SettingsDto as Settings,
  DeviceDto as Device,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
type SettingsForm = DeepPartial<Settings>;

type WaterPreset = { label: string; soilMin: number; soilMax: number };
type VentPreset = { label: string; humLo: number; humHi: number };

const WATERING_PRESETS: WaterPreset[] = [
  { label: "Succulents / Cacti (dry-loving)", soilMin: 20, soilMax: 35 },
  { label: "Herbs & Mediterranean",            soilMin: 35, soilMax: 55 },
  { label: "Fruiting veg (tomato/pepper)",     soilMin: 40, soilMax: 60 },
  { label: "Leafy greens",                     soilMin: 45, soilMax: 65 },
  { label: "Tropical / moisture-loving",       soilMin: 50, soilMax: 70 },
];

const VENT_PRESETS: VentPreset[] = [
  { label: "Seedlings / propagation",          humLo: 50, humHi: 65 },
  { label: "Leafy greens",                     humLo: 45, humHi: 60 },
  { label: "Fruiting veg (tomato/pepper)",     humLo: 40, humHi: 55 },
  { label: "Mediterranean herbs",              humLo: 35, humHi: 50 },
  { label: "Tropical / moisture-loving",       humLo: 50, humHi: 70 },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mac } = useParams<{ mac?: string }>();
  const selectedMac = mac ?? "";

  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState<SettingsForm>({});
  const [loadingDevices, setLoadingDev] = useState(true);
  const [loadingSettings, setLoadingSet] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ───── load device list ───── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingDev(true);
      try {
        setDevices(await getDevices());
      } catch (err) {
        console.error("❌ listDevices error:", err);
        toast.error("Failed to load devices");
      } finally {
        setLoadingDev(false);
      }
    })();
  }, [user]);

  /* ───── redirect to first device if none in URL ───── */
  useEffect(() => {
    if (!selectedMac && !loadingDevices && devices.length) {
      navigate(`/settings/${encodeURIComponent(devices[0].mac)}`, {
        replace: true,
      });
    }
  }, [selectedMac, loadingDevices, devices, navigate]);

  /* ───── load settings for selectedMac ───── */
  useEffect(() => {
    if (!selectedMac) return; // guard
    (async () => {
      setLoadingSet(true);
      try {
        setForm(await getSettings(selectedMac));
      } catch (err) {
        console.error("❌ getSettings error:", err);
        toast.error("Failed to load settings");
      } finally {
        setLoadingSet(false);
      }
    })();
  }, [selectedMac]);

  /* ───── form patch helper ───── */
  const patch = <K extends keyof SettingsForm>(
    section: K,
    patchVal: DeepPartial<SettingsForm[K]>
  ) =>
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev[section] ?? {}), ...patchVal },
    }));

  /* ───── derived watering guidance ───── */
  const wateringHints = useMemo(() => {
    const notes: string[] = [];
    const soilMin = form.watering?.soilMin;
    const soilMax = form.watering?.soilMax;

    if (soilMin != null && soilMin < 25) {
      notes.push(
        "Very low Soil Min can stress many plants (okay for succulents/cacti)."
      );
    }
    if (soilMax != null && soilMax > 70) {
      notes.push(
        "Very high Soil Max can keep soil too wet; roots need oxygen and may rot."
      );
    }
    if (
      soilMin != null &&
      soilMax != null &&
      soilMax > soilMin &&
      soilMax - soilMin < 10
    ) {
      notes.push(
        "The gap between Min and Max is quite narrow; the pump may toggle frequently."
      );
    }
    return notes;
  }, [form.watering?.soilMin, form.watering?.soilMax]);

  /* ───── derived 'door' (vent) guidance ───── */
  const ventHints = useMemo(() => {
    const tips: string[] = [];
    const humLo = form.vent?.humLo;
    const humHi = form.vent?.humHi;

    if (humHi != null && humHi > 65) {
      tips.push(
        "Very high High humidity increases risk of mildew and fungal disease."
      );
    }
    if (humLo != null && humLo < 40) {
      tips.push(
        "Very low Low humidity can stress tender plants (herbs tolerate it better)."
      );
    }
    if (
      humLo != null &&
      humHi != null &&
      humHi > humLo &&
      humHi - humLo < 8
    ) {
      tips.push(
        "The humidity band is narrow; the fresh-air door may chatter (rapid open/close). Consider at least an 8–12% gap."
      );
    }
    return tips;
  }, [form.vent?.humLo, form.vent?.humHi]);

  /* ───── basic validation (mirrors backend ranges) ───── */
  const validate = () => {
    const { watering, vent, security } = form;

    // Watering
    if (watering) {
      const { soilMin, soilMax } = watering;
      if (soilMin != null && (soilMin < 20 || soilMin > 60)) {
        toast.error("Watering: Soil Min must be between 20 and 60");
        return false;
      }
      if (soilMax != null && (soilMax < 40 || soilMax > 80)) {
        toast.error("Watering: Soil Max must be between 40 and 80");
        return false;
      }
      if (soilMin != null && soilMax != null && soilMin >= soilMax) {
        toast.error("Watering: Soil Min must be < Soil Max");
        return false;
      }
    }

    // Door (Vent)
    if (vent) {
      const { humLo, humHi } = vent;
      if (humLo != null && (humLo < 35 || humLo > 55)) {
        toast.error("Door: Low humidity must be between 35 and 55");
        return false;
      }
      if (humHi != null && (humHi < 45 || humHi > 70)) {
        toast.error("Door: High humidity must be between 45 and 70");
        return false;
      }
      if (humLo != null && humHi != null && humHi <= humLo) {
        toast.error("Door: High humidity must be greater than Low humidity");
        return false;
      }
    }

    // Security Alarm Window
    if (security?.alarmWindow) {
      const { start, end } = security.alarmWindow;
      if (!start || !end) {
        toast.error("Alarm window must include both start and end");
        return false;
      }
      const re = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!re.test(start) || !re.test(end)) {
        toast.error("Alarm window times must be HH:MM");
        return false;
      }
    }

    return true;
  };

  /* ───── save ───── */
  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateSettings(selectedMac, form as Settings);
      toast.success("Settings saved");
    } catch (err) {
      console.error("❌ updateSettings error:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  /* ───── UI ───── */
  if (loadingDevices) return <Loader />;
  if (!selectedMac) return null; // redirect effect will handle it

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <select
        className="input mb-4"
        value={selectedMac}
        onChange={(e) =>
          navigate(`/settings/${encodeURIComponent(e.target.value)}`)
        }
      >
        {devices.map((d) => (
          <option key={d.mac} value={d.mac}>
            {d.name}
          </option>
        ))}
      </select>

      {loadingSettings ? (
        <Loader />
      ) : (
        <div className="space-y-6">
          {/* Watering */}
          <fieldset className="space-y-3">
            <legend className="font-medium">Watering</legend>

            {/* Quick presets */}
            <label>
              Plant preset (optional)
              <select
                className="input mt-1"
                value=""
                onChange={(e) => {
                  const idx = e.target.value ? Number(e.target.value) : NaN;
                  if (!Number.isNaN(idx)) {
                    const p = WATERING_PRESETS[idx];
                    patch("watering", { soilMin: p.soilMin, soilMax: p.soilMax });
                    toast.success(`Applied preset: ${p.label}`);
                    e.currentTarget.value = "";
                  }
                }}
              >
                <option value="">— choose a preset —</option>
                {WATERING_PRESETS.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label} ({p.soilMin}–{p.soilMax}%)
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.watering?.manual ?? false}
                onChange={(e) => patch("watering", { manual: e.target.checked })}
              />
              Manual watering
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="inline-flex items-center gap-2">
                  Soil Min (%)
                  <span
                    className="ml-1 cursor-help text-sm select-none"
                    title="When moisture falls below this value, watering can start. Lower values suit drought-tolerant plants."
                  >
                    ⓘ
                  </span>
                </span>
                <input
                  type="number"
                  className="input mt-1"
                  value={form.watering?.soilMin ?? ""}
                  min={20}
                  max={60}
                  onChange={(e) =>
                    patch("watering", { soilMin: +e.target.value })
                  }
                  aria-describedby="soil-min-help"
                />
              </label>
              <label>
                <span className="inline-flex items-center gap-2">
                  Soil Max (%)
                  <span
                    className="ml-1 cursor-help text-sm select-none"
                    title="When moisture rises above this value, watering stops. Too high can keep soil waterlogged and reduce root oxygen."
                  >
                    ⓘ
                  </span>
                </span>
                <input
                  type="number"
                  className="input mt-1"
                  value={form.watering?.soilMax ?? ""}
                  min={40}
                  max={80}
                  onChange={(e) =>
                    patch("watering", { soilMax: +e.target.value })
                  }
                  aria-describedby="soil-max-help"
                />
              </label>
            </div>

            {/* Helper text */}
            <p className="text-sm text-gray-600" id="soil-min-help">
              <strong>How to choose:</strong> pick a <em>Soil Min</em> where
              your plant starts to droop or the top few cm feel dry for its
              species; pick a <em>Soil Max</em> that leaves the root zone moist
              but not soggy. Different plants prefer different ranges (use a
              preset above as a starting point).
            </p>
            {wateringHints.length > 0 && (
              <ul className="list-disc pl-5 text-sm text-amber-600">
                {wateringHints.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}

            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer select-none">
                Why these numbers?
              </summary>
              <div className="mt-1 space-y-1">
                <p>
                  Soil sensors report a relative moisture %. Plants need both
                  water and oxygen at the roots. If <em>Soil Max</em> is too
                  high, soil can stay waterlogged and roots may suffocate or
                  rot. If <em>Soil Min</em> is too low, many plants will
                  experience drought stress (succulents are an exception).
                </p>
                <p>
                  Start with a preset, observe your plant for a week, then
                  adjust ±5% to reduce stress or oversaturation.
                </p>
              </div>
            </details>
          </fieldset>

          {/* Fresh-Air Door (formerly Vent) */}
          <fieldset className="space-y-3">
            <legend className="font-medium">Fresh-Air Door</legend>

            {/* Door presets */}
            <label>
              Door humidity preset (optional)
              <select
                className="input mt-1"
                value=""
                onChange={(e) => {
                  const idx = e.target.value ? Number(e.target.value) : NaN;
                  if (!Number.isNaN(idx)) {
                    const p = VENT_PRESETS[idx];
                    patch("vent", { humLo: p.humLo, humHi: p.humHi });
                    toast.success(`Applied preset: ${p.label}`);
                    e.currentTarget.value = "";
                  }
                }}
              >
                <option value="">— choose a preset —</option>
                {VENT_PRESETS.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label} ({p.humLo}–{p.humHi}% RH)
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.vent?.manual ?? false}
                onChange={(e) => patch("vent", { manual: e.target.checked })}
              />
              Manual door control
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="inline-flex items-center gap-2">
                  Low humidity (% RH)
                  <span
                    className="ml-1 cursor-help text-sm select-none"
                    title="Below this, the controller prefers to keep the door closed to retain humidity. Too low can stress many plants."
                  >
                    ⓘ
                  </span>
                </span>
                <input
                  type="number"
                  className="input mt-1"
                  value={form.vent?.humLo ?? ""}
                  min={35}
                  max={55}
                  onChange={(e) => patch("vent", { humLo: +e.target.value })}
                  aria-describedby="hum-lo-help"
                />
              </label>
              <label>
                <span className="inline-flex items-center gap-2">
                  High humidity (% RH)
                  <span
                    className="ml-1 cursor-help text-sm select-none"
                    title="Above this, the controller opens the fresh-air door to vent moisture. Too high encourages mildew and fungal disease."
                  >
                    ⓘ
                  </span>
                </span>
                <input
                  type="number"
                  className="input mt-1"
                  value={form.vent?.humHi ?? ""}
                  min={45}
                  max={70}
                  onChange={(e) => patch("vent", { humHi: +e.target.value })}
                  aria-describedby="hum-hi-help"
                />
              </label>
            </div>

            {/* Helper text */}
            <p className="text-sm text-gray-600" id="hum-lo-help">
              Choose a humidity band that fits your crop and climate. Higher
              humidity reduces water loss but raises disease risk; lower humidity
              improves airflow and reduces mold but can stress tender plants.
              Keep an 8–12% gap to avoid rapid open/close cycles of the door.
            </p>
            {ventHints.length > 0 && (
              <ul className="list-disc pl-5 text-sm text-amber-600">
                {ventHints.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}

            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer select-none">
                How the fresh-air door thresholds work
              </summary>
              <div className="mt-1 space-y-1">
                <p>
                  The controller uses a humidity band: below <em>Low</em> it
                  tends to keep the door closed to retain moisture; above{" "}
                  <em>High</em> it opens the door to remove moisture. A healthy
                  gap adds hysteresis and prevents chattering.
                </p>
                <p>
                  Start with a preset, monitor condensation and leaf condition
                  for a few days, then adjust ±5% to balance stress vs. disease
                  risk.
                </p>
              </div>
            </details>
          </fieldset>

          {/* Security */}
          <fieldset className="space-y-3">
            <legend className="font-medium">Security (Alarm)</legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.security?.armed ?? false}
                onChange={(e) => patch("security", { armed: e.target.checked })}
              />
              Alarm armed
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(["start", "end"] as const).map((field) => (
                <label key={field}>
                  <span className="inline-flex items-center gap-2">
                    Window {field}
                    <span
                      className="ml-1 cursor-help text-sm select-none"
                      title={
                        field === "start"
                          ? "Start time for arming window (HH:MM, 24h)."
                          : "End time for arming window (HH:MM, 24h). If end is earlier than start, the window crosses midnight."
                      }
                    >
                      ⓘ
                    </span>
                  </span>
                  <input
                    type="time"
                    className="input mt-1"
                    value={form.security?.alarmWindow?.[field] ?? ""}
                    onChange={(e) =>
                      patch("security", {
                        alarmWindow: {
                          ...(form.security?.alarmWindow ?? {}),
                          [field]: e.target.value,
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Example: Start 22:00 and End 06:00 arms overnight; the range wraps
              past midnight.
            </p>
          </fieldset>

          {/* Save button */}
          <button
            className="btn btn-primary w-full"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
