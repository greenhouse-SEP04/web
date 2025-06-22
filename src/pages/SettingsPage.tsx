import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listDevices as getDevices,
  getSettings,
  updateSettings,
} from "@/services/api";
import type {
  SettingsDto as Settings,
  DeviceDto   as Device,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

/* ──────────────────────────────────────────────────────────── */
type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
type SettingsForm   = DeepPartial<Settings>;
/* ──────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { user } = useAuth();

  const [devices,         setDevices]         = useState<Device[]>([]);
  const [selected,        setSelected]        = useState("");
  const [form,            setForm]            = useState<SettingsForm>({});
  const [loadingDevices,  setLoadingDevices]  = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving,          setSaving]          = useState(false);

  const [params] = useSearchParams();
  const paramMac = params.get("mac") || "";

  /* ───────── devices ───────── */
  useEffect(() => {
    setLoadingDevices(true);
    getDevices()
      .then((all) => {
        const visible = user?.roles?.includes("Admin") ? all :all.filter((d) => d.ownerId === user?.id);

        setDevices(visible);
        if (!visible.length) return;
        const first = visible[0].mac;
        setSelected(visible.some((d) => d.mac === paramMac) ? paramMac : first);
      })
      .finally(() => setLoadingDevices(false));
  }, [user, paramMac]);

  /* ───────── settings ───────── */
  useEffect(() => {
    if (!selected) return;
    setLoadingSettings(true);
    getSettings(selected)
      .then((s) => setForm(s || {}))
      .finally(() => setLoadingSettings(false));
  }, [selected]);

  /* ───────── helpers ───────── */
  const patch = <K extends keyof SettingsForm>(
    section: K,
    patch: DeepPartial<SettingsForm[K]>
  ) =>
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev[section] ?? {}), ...patch },
    }));

  /* ───────── validation ───────── */
  const validate = () => {
    const { watering, lighting, security } = form;

    if (lighting) {
      if (
        lighting.onHour !== undefined &&
        (lighting.onHour < 0 || lighting.onHour > 23)
      )
        return toast.error("On Hour 0-23") && false;
      if (
        lighting.offHour !== undefined &&
        (lighting.offHour < 0 || lighting.offHour > 23)
      )
        return toast.error("Off Hour 0-23") && false;
    }

    if (
      watering &&
      watering.soilMin !== undefined &&
      watering.soilMax !== undefined &&
      watering.soilMin >= watering.soilMax
    )
      return toast.error("Soil Min < Soil Max") && false;

    if (security?.alarmWindow) {
    const { start, end } = security.alarmWindow;

    // either value missing → invalid
    if (!start || !end)
      return toast.error("Alarm window HH:MM") && false;

    const re = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!re.test(start) || !re.test(end))
      return toast.error("Alarm window HH:MM") && false;
    }

    return true;
  };

  /* ───────── save ───────── */
  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateSettings(selected, form as Settings);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  /* ───────── UI ───────── */
  if (loadingDevices)
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );

  if (!devices.length)
    return (
      <p className="text-center text-muted-foreground">No devices available</p>
    );

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      {/* device selector */}
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
          <div className="space-y-6">
            {/* ───── Watering ───── */}
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
                    onChange={(e) =>
                      patch("watering", { soilMax: +e.target.value })
                    }
                  />
                </label>
              </div>

              <label>
                Fertiliser hour
                <select
                  className="input mt-1"
                  value={(form.watering?.fertHours ?? "").toString()}
                  onChange={(e) =>
patch("watering", {
              fertHours:
                e.target.value === "" ? undefined : Number(e.target.value),
            })
                  }
                >
                  <option value="">-- choose --</option>
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            {/* ───── Lighting ───── */}
            <fieldset className="space-y-3">
              <legend className="font-medium">Lighting</legend>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.lighting?.manual ?? false}
                  onChange={(e) => patch("lighting", { manual: e.target.checked })}
                />
                Manual lighting
              </label>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Lux Low", key: "luxLow" as const },
                  { label: "On Hour", key: "onHour" as const },
                  { label: "Off Hour", key: "offHour" as const },
                ].map(({ label, key }) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min={key.includes("Hour") ? 0 : undefined}
                      max={key.includes("Hour") ? 23 : undefined}
                      className="input mt-1"
                      value={(form.lighting?.[key] ?? "") as number | string}
                      onChange={(e) =>
                        patch("lighting", { [key]: +e.target.value } as any)
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            {/* ───── Security / Alarm ───── */}
            <fieldset className="space-y-3">
              <legend className="font-medium">Security (Alarm)</legend>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.security?.armed ?? false}
                  onChange={(e) =>
                    patch("security", { armed: e.target.checked })
                  }
                />
                Alarm armed
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label>
                  Window start (HH:MM)
                  <input
                    type="time"
                    className="input mt-1"
                    value={form.security?.alarmWindow?.start ?? ""}
                    onChange={(e) =>
                      patch("security", {
                        alarmWindow: {
                          ...(form.security?.alarmWindow ?? {}),
                          start: e.target.value,
                        },
                      })
                    }
                  />
                </label>

                <label>
                  Window end (HH:MM)
                  <input
                    type="time"
                    className="input mt-1"
                    value={form.security?.alarmWindow?.end ?? ""}
                    onChange={(e) =>
                      patch("security", {
                        alarmWindow: {
                          ...(form.security?.alarmWindow ?? {}),
                          end: e.target.value,
                        },
                      })
                    }
                  />
                </label>
              </div>
            </fieldset>

            {/* save */}
            <button
              className="btn btn-primary w-full flex items-center justify-center"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )
      )}
    </div>
  );
}
