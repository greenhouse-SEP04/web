// src/pages/SettingsPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSettings, updateSettings, getDevices } from "@/services/mockApi";
import type { Settings, Device } from "@/services/mockApi";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [form, setForm] = useState<Partial<Settings>>({});
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const [params] = useSearchParams();
  const paramMac = params.get("mac") || "";

  /* fetch device list */
  useEffect(() => {
    setLoadingDevices(true);
    getDevices(user!.role === "admin" ? undefined : user!.id)
      .then((devs) => {
        setDevices(devs);
        if (!devs.length) return;
        const first = devs[0].mac;
        setSelected(devs.some((d) => d.mac === paramMac) ? paramMac : first);
      })
      .finally(() => setLoadingDevices(false));
  }, [user, paramMac]);

  /* fetch settings */
  useEffect(() => {
    if (!selected) return;
    setLoadingSettings(true);
    getSettings(selected)
      .then((s) => setForm(s || {}))
      .finally(() => setLoadingSettings(false));
  }, [selected]);

  /* validation */
  const validateForm = (): boolean => {
    const { onHour, offHour, soilMin, soilMax } = form;
    if (onHour !== undefined && (onHour < 0 || onHour > 23)) {
      toast.error("On Hour must be between 0 and 23");
      return false;
    }
    if (offHour !== undefined && (offHour < 0 || offHour > 23)) {
      toast.error("Off Hour must be between 0 and 23");
      return false;
    }
    if (soilMin !== undefined && soilMax !== undefined && soilMin >= soilMax) {
      toast.error("Soil Min should be less than Soil Max");
      return false;
    }
    return true;
  };

  /* save handler */
  const save = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await updateSettings(selected, form);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  /* UI */
  if (loadingDevices) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!devices.length) {
    return <p className="text-center text-muted-foreground">No devices available</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <select
        className="input mb-4"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {devices.map((d) => (
          <option key={d.mac} value={d.mac}>
            {d.name}
          </option>
        ))}
      </select>

      {loadingSettings ? (
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        selected && (
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.wateringManual ?? false}
                onChange={(e) =>
                  setForm({ ...form, wateringManual: e.target.checked })
                }
              />
              Manual watering
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <span>Soil Min (%)</span>
                <input
                  type="number"
                  className="input mt-1"
                  value={form.soilMin ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, soilMin: +e.target.value })
                  }
                />
              </label>
              <label>
                <span>Soil Max (%)</span>
                <input
                  type="number"
                  className="input mt-1"
                  value={form.soilMax ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, soilMax: +e.target.value })
                  }
                />
              </label>
            </div>

            <label className="block">
              <span>Fertiliser hours</span>
              <select
                multiple
                className="input mt-1"
                value={form.fertHours?.map(String) ?? []}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fertHours: Array.from(
                      e.target.selectedOptions,
                      (o) => +o.value
                    ),
                  })
                }
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.lightingManual ?? false}
                onChange={(e) =>
                  setForm({ ...form, lightingManual: e.target.checked })
                }
              />
              Manual lighting
            </label>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Lux Low", key: "luxLow" },
                { label: "On Hour", key: "onHour" },
                { label: "Off Hour", key: "offHour" },
              ].map(({ label, key }) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    type="number"
                    min={key.includes("Hour") ? 0 : undefined}
                    max={key.includes("Hour") ? 23 : undefined}
                    className="input mt-1"
                    value={(form as any)[key] ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, [key]: +e.target.value })
                    }
                  />
                </label>
              ))}
            </div>

            <button
              className="btn btn-primary w-full flex items-center justify-center"
              onClick={save}
              disabled={saving}
            >
              {saving && (
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8h4z"
                  />
                </svg>
              )}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )
      )}
    </div>
  );
}
