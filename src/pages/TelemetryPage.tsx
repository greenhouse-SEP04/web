// src/pages/TelemetryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listDevices   as getDevices,
  isDeviceActive,
  getTelemetry,
  getSettings,
} from "@/services/api";
import type {
  DeviceDto    as Device,
  TelemetryDto as Telemetry,
  SettingsDto  as Settings,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";
import clsx from "clsx";
import { Settings as SettingsIcon } from "lucide-react";

/* ─────────────────────── Loader ─────────────────────── */
function Loader() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

/* ─────────────────────── constants ─────────────────────── */
type MeasurementKey = "temperature" | "humidity" | "soil" | "lux" | "motion" | "tamper";

const measurementOptions: { value: MeasurementKey; label: string }[] = [
  { value: "temperature", label: "Temperature (°C)" },
  { value: "humidity",    label: "Humidity (%)"    },
  { value: "soil",        label: "Soil (%)"        },
  { value: "lux",         label: "Lux"             },
  { value: "motion",      label: "Motion"          },
  { value: "tamper",      label: "Tamper"          },
];

const LOW_SOIL  = 30;
const HIGH_TEMP = 30;

/* ─────────────────────── helpers ─────────────────────── */
const waterIcon = (lvl: number) =>
  lvl >= 70 ? "💧💧💧" :
  lvl >= 40 ? "💧💧"   :
  lvl >= 10 ? "💧"     : "—";

const inWindow = (time: string, start: string, end: string) =>
  start === end ? true
    : start < end ? time >= start && time < end
    :               time >= start || time < end;

/* ─────────────────────── component ─────────────────────── */
type DeviceWithStatus = Device & { status: "online" | "offline" };

export default function TelemetryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mac }  = useParams<{ mac?: string }>();
  const selectedMac = mac ?? "";

  /* ───── state ───── */
  const [devices, setDevices]           = useState<DeviceWithStatus[]>([]);
  const [data, setData]                 = useState<Telemetry[]>([]);
  const [devSettings, setDevSettings]   = useState<Settings | null>(null);
  const [loadingDevices, setLoadingDev] = useState(true);
  const [loadingTel, setLoadingTel]     = useState(false);
  const [selectedMeasurements, setSelectedMeasurements] =
    useState<MeasurementKey[]>(["temperature"]);

  const today = new Date().toISOString().slice(0, 10);
  const [startDate] = useState(today);
  const [endDate]   = useState(today);

  /* ───── load device list + status ───── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingDev(true);
      try {
        const all = await getDevices();
        const enriched: DeviceWithStatus[] = await Promise.all(
          all.map(async d => {
            const active = await isDeviceActive(d.mac);
            return {
              ...d,
              // cast the literal so TS knows it's exactly "online"|"offline"
              status: active ? "online" as const : "offline" as const,
            };
          })
        );
        setDevices(enriched);
      } catch (err) {
        console.error("Failed to load devices", err);
      } finally {
        setLoadingDev(false);
      }
    })();
  }, [user]);

  /* ───── redirect to first device if none in URL ───── */
  useEffect(() => {
    if (!selectedMac && !loadingDevices && devices.length) {
      navigate(
        `/telemetry/${encodeURIComponent(devices[0].mac)}`,
        { replace: true }
      );
    }
  }, [selectedMac, loadingDevices, devices, navigate]);

  /* ───── load telemetry + settings ───── */
  useEffect(() => {
    if (!selectedMac) return; // guard
    (async () => {
      setLoadingTel(true);
      try {
        const [tel, s] = await Promise.all([
          getTelemetry(selectedMac),
          getSettings(selectedMac),
        ]);
        setData(tel);
        setDevSettings(s);
      } catch (err) {
        console.error("Failed to load telemetry/settings", err);
      } finally {
        setLoadingTel(false);
      }
    })();
  }, [selectedMac]);

  /* ───── derive filtered data ───── */
  const filtered = useMemo(() => (
    data
      .filter(d => {
        const dt = d.timestamp.slice(0, 10);
        return dt >= startDate && dt <= endDate;
      })
      .map(d => ({ ...d, time: d.timestamp.slice(11, 19) }))
  ), [data, startDate, endDate]);

  const { page, setPage, totalPages, pageData } = usePagination(filtered, 5);

  const device = devices.find(d => d.mac === selectedMac);
  const latest = filtered.length > 0 ? filtered[filtered.length - 1] : undefined;

  /* ───── alerts & alarm events ───── */
  const alerts: string[] = [];
  if (device && device.status !== "online") {
    alerts.push("Device is offline");
  } else if (latest) {
    if (latest.soil        < LOW_SOIL ) alerts.push("Soil moisture is low");
    if (latest.temperature > HIGH_TEMP) alerts.push("Temperature is high");
  }
  const ok = alerts.length === 0 && device?.status === "online";

  const alarmEvents = useMemo(() => {
    if (!devSettings?.security?.armed) return [];
    const { start, end } = devSettings.security.alarmWindow;
    return filtered.filter(d =>
      (d.motion || d.tamper) &&
      inWindow(d.timestamp.slice(11,16), start, end)
    );
  }, [filtered, devSettings]);

  /* ───── render ───── */
  if (loadingDevices) return <Loader />;
  if (!selectedMac) return null; // redirect effect will handle

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">
        Telemetry for {device?.name ?? selectedMac}
      </h1>

      {device && (
        <div
          className={clsx(
            "mb-4 rounded-md p-3 text-sm",
            ok
              ? "bg-green-100 text-green-700"
              : device.status !== "online"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          )}
        >
          {ok ? "Everything is OK 👍" : alerts.join(" · ")}
        </div>
      )}

      {alarmEvents.length > 0 && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <strong>Alarm triggered</strong>{" "}
          {alarmEvents.length} time{alarmEvents.length > 1 && "s"}:{" "}
          {alarmEvents
            .slice(-5)
            .map(e => e.timestamp.replace("T", " ").slice(0,19))
            .join(" · ")}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <select
          className="input"
          value={selectedMac}
          onChange={e =>
            navigate(`/telemetry/${encodeURIComponent(e.target.value)}`)
          }
        >
          {devices.map(d => (
            <option key={d.mac} value={d.mac}>
              {d.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-secondary flex items-center gap-1"
          onClick={() =>
            navigate(`/settings/${encodeURIComponent(selectedMac)}`)
          }
        >
          <SettingsIcon className="h-4 w-4" /> Edit settings
        </button>

        <select
          multiple
          size={measurementOptions.length}
          className="input"
          value={selectedMeasurements}
          onChange={e =>
            setSelectedMeasurements(
              Array.from(e.target.selectedOptions, o => o.value as MeasurementKey)
            )
          }
        >
          {measurementOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {!loadingTel && filtered.length > 0 && selectedMeasurements.length > 0 && (
        <div className="flex justify-center">
          <LineChart width={900} height={320} data={filtered}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip
              labelFormatter={label =>
                `Time: ${label}, Timestamp: ${
                  filtered.find(d => d.time === label)?.timestamp
                }`
              }
            />
            {selectedMeasurements.map(m => (
              <Line
                key={m}
                type="monotone"
                dataKey={m}
                dot={false}
                name={measurementOptions.find(o => o.value === m)?.label}
              />
            ))}
          </LineChart>
        </div>
      )}

      {!loadingTel && filtered.length > 0 && (
        <>
          <table className="w-full mt-6 text-sm border">
            <thead>
              <tr className="bg-muted/20 text-center">
                <th className="p-2">Time</th>
                {measurementOptions.map(opt => (
                  <th
                    key={opt.value}
                    className={clsx(
                      "p-2",
                      selectedMeasurements.includes(opt.value) && "bg-blue-100"
                    )}
                  >
                    {opt.label}
                  </th>
                ))}
                <th className="p-2">Water</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(d => (
                <tr key={d.timestamp} className="border-t">
                  <td className="p-2 text-left whitespace-nowrap">{d.time}</td>
                  {measurementOptions.map(opt => (
                    <td
                      key={opt.value}
                      className={clsx(
                        "p-2 text-center",
                        selectedMeasurements.includes(opt.value) && "font-semibold bg-blue-50"
                      )}
                    >
                      {["tamper","motion"].includes(opt.value)
                        ? d[opt.value]
                          ? "⚠️"
                          : "OK"
                        : Number(
                            d[
                              opt.value as Exclude<MeasurementKey,"tamper"|"motion">
                            ]
                          ).toFixed(2)
                      }
                    </td>
                  ))}
                  <td className="p-2 text-center">{waterIcon(d.level)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
