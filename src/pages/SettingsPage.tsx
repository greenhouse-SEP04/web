// src/pages/SettingsPage.tsx
import { useEffect, useState } from "react";
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

    // Vent
    if (vent) {
      const { humLo, humHi } = vent;
      if (humLo != null && (humLo < 35 || humLo > 55)) {
        toast.error("Vent: Low humidity must be between 35 and 55");
        return false;
      }
      if (humHi != null && (humHi < 45 || humHi > 70)) {
        toast.error("Vent: High humidity must be between 45 and 70");
        return false;
      }
      if (humLo != null && humHi != null && humHi <= humLo) {
        toast.error("Vent: High humidity must be greater than Low humidity");
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
                Soil Min (%)
                <input
                  type="number"
                  className="input mt-1"
                  value={form.watering?.soilMin ?? ""}
                  min={20}
                  max={60}
                  onChange={(e) =>
                    patch("watering", { soilMin: +e.target.value })
                  }
                />
              </label>
              <label>
                Soil Max (%)
                <input
                  type="number"
                  className="input mt-1"
                  value={form.watering?.soilMax ?? ""}
                  min={40}
                  max={80}
                  onChange={(e) =>
                    patch("watering", { soilMax: +e.target.value })
                  }
                />
              </label>
            </div>
          </fieldset>

          {/* Vent */}
          <fieldset className="space-y-3">
            <legend className="font-medium">Ventilation</legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.vent?.manual ?? false}
                onChange={(e) => patch("vent", { manual: e.target.checked })}
              />
              Manual vent control
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label>
                Low humidity (%)
                <input
                  type="number"
                  className="input mt-1"
                  value={form.vent?.humLo ?? ""}
                  min={35}
                  max={55}
                  onChange={(e) => patch("vent", { humLo: +e.target.value })}
                />
              </label>
              <label>
                High humidity (%)
                <input
                  type="number"
                  className="input mt-1"
                  value={form.vent?.humHi ?? ""}
                  min={45}
                  max={70}
                  onChange={(e) => patch("vent", { humHi: +e.target.value })}
                />
              </label>
            </div>
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
                  Window {field}
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
