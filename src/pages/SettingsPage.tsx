import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
type SettingsForm   = DeepPartial<Settings>;

function Loader() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mac } = useParams<{ mac?: string }>();
  const selectedMac = mac ?? "";

  const [devices, setDevices] = useState<Device[]>([]);
  const [form,    setForm]    = useState<SettingsForm>({});
  const [loadingDevices,  setLoadingDev] = useState(true);
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
      navigate(`/settings/${encodeURIComponent(devices[0].mac)}`, { replace: true });
    }
  }, [selectedMac, loadingDevices, devices, navigate]);

  /* ───── load settings for selectedMac ───── */
  useEffect(() => {
    if (!selectedMac) return;      // guard
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
    patchVal: DeepPartial<SettingsForm[K]>,
  ) => setForm(prev => ({
    ...prev,
    [section]: { ...(prev[section] ?? {}), ...patchVal },
  }));

  /* ───── basic validation ───── */
  const validate = () => {
    const { watering, lighting, security } = form;
    if (lighting) {
      const { onHour, offHour } = lighting;
      if (onHour != null && (onHour < 0 || onHour > 23)) {
        toast.error("Lighting: On Hour must be 0–23");
        return false;
      }
      if (offHour != null && (offHour < 0 || offHour > 23)) {
        toast.error("Lighting: Off Hour must be 0–23");
        return false;
      }
    }
    if (watering && watering.soilMin != null && watering.soilMax != null &&
        watering.soilMin >= watering.soilMax) {
      toast.error("Watering: Soil Min must be < Soil Max");
      return false;
    }
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
  if (!selectedMac) return null;   // redirect effect will handle it

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <select
        className="input mb-4"
        value={selectedMac}
        onChange={e => navigate(`/settings/${encodeURIComponent(e.target.value)}`)}
      >
        {devices.map(d => (
          <option key={d.mac} value={d.mac}>{d.name}</option>
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
                onChange={e => patch("watering", { manual: e.target.checked })}
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
                  onChange={e => patch("watering", { soilMin: +e.target.value })}
                />
              </label>
              <label>
                Soil Max (%)
                <input
                  type="number"
                  className="input mt-1"
                  value={form.watering?.soilMax ?? ""}
                  onChange={e => patch("watering", { soilMax: +e.target.value })}
                />
              </label>
            </div>
            <label>
              Fertiliser hour
              <select
                className="input mt-1"
                value={(form.watering?.fertHours ?? "").toString()}
                onChange={e => patch("watering", {
                  fertHours: e.target.value ? Number(e.target.value) : undefined,
                })}
              >
                <option value="">-- choose --</option>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </label>
          </fieldset>

          {/* Lighting */}
          <fieldset className="space-y-3">
            <legend className="font-medium">Lighting</legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.lighting?.manual ?? false}
                onChange={e => patch("lighting", { manual: e.target.checked })}
              />
              Manual lighting
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(["luxLow","onHour","offHour"] as const).map(key => (
                <label key={key}>
                  {key === "luxLow" ? "Lux Low" : key === "onHour" ? "On Hour" : "Off Hour"}
                  <input
                    type="number"
                    min={key !== "luxLow" ? 0 : undefined}
                    max={key !== "luxLow" ? 23 : undefined}
                    className="input mt-1"
                    value={form.lighting?.[key] ?? ""}
                    onChange={e => patch("lighting", { [key]: +e.target.value } as any)}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          {/* Security */}
          <fieldset className="space-y-3">
            <legend className="font-medium">Security (Alarm)</legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.security?.armed ?? false}
                onChange={e => patch("security", { armed: e.target.checked })}
              />
              Alarm armed
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(["start","end"] as const).map(field => (
                <label key={field}>
                  Window {field}
                  <input
                    type="time"
                    className="input mt-1"
                    value={form.security?.alarmWindow?.[field] ?? ""}
                    onChange={e =>
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
