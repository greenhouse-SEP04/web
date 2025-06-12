import { useEffect, useState } from "react";
import {
  getSettings,
  updateSettings,
  getDevices,
} from "@/services/mockApi";
import type { Settings, Device } from "@/services/mockApi";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [form, setForm] = useState<Partial<Settings>>({});

  useEffect(() => {
    getDevices(user!.role === "admin" ? undefined : user!.id).then(devs => {
      setDevices(devs);
      if (devs.length) setSelected(devs[0].mac);
    });
  }, [user]);

  useEffect(() => {
    if (selected) getSettings(selected).then(s => setForm(s || {}));
  }, [selected]);

  const save = async () => {
    await updateSettings(selected, form);
    alert("Settings saved");
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <select
        className="input mb-4"
        value={selected}
        onChange={e => setSelected(e.target.value)}
      >
        {devices.map(d => (
          <option key={d.mac} value={d.mac}>
            {d.name}
          </option>
        ))}
      </select>
      {selected && (
        <div className="space-y-4">
          <label className="block">
            <span>Soil Min</span>
            <input
              type="number"
              className="input mt-1"
              value={form.soilMin ?? ""}
              onChange={e => setForm({ ...form, soilMin: +e.target.value })}
            />
          </label>
          <label className="block">
            <span>Soil Max</span>
            <input
              type="number"
              className="input mt-1"
              value={form.soilMax ?? ""}
              onChange={e => setForm({ ...form, soilMax: +e.target.value })}
            />
          </label>
          {/* add more fields as needed */}
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}
