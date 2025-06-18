// src/pages/TelemetryPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  getDevices,
  getTelemetry,
  getSettings,
} from "@/services/mockApi";
import type { Device, Telemetry, Settings } from "@/services/mockApi";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";
import clsx from "clsx";
import { Settings as SettingsIcon } from "lucide-react";

/* ───────────────────────── constants ───────────────────────── */
const measurementOptions = [
  { value: "temperature", label: "Temperature (°C)" },
  { value: "humidity", label: "Humidity (%)" },
  { value: "soil", label: "Soil (%)" },
  { value: "lux", label: "Lux" },
  { value: "tamper", label: "Tamper" },
];

const LOW_SOIL = 30;
const HIGH_TEMP = 30;

/* ─────────────────────── helpers ─────────────────────── */
const waterIcon = (lvl: number): string => {
  if (lvl >= 70) return "💧💧💧";
  if (lvl >= 40) return "💧💧";
  if (lvl >= 10) return "💧";
  return "—";
};

function Loader() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

/* ─────────────────────── component ─────────────────────── */
export default function TelemetryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMac = params.get("mac") || "";

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedMac, setSelectedMac] = useState(initialMac);
  const today = new Date().toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>([
    "temperature",
  ]);

  const [data, setData] = useState<Telemetry[]>([]);
  const [devSettings, setDevSettings] = useState<Settings | null>(null);

  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingTel, setLoadingTel] = useState(false);

  useEffect(() => {
    setLoadingDevices(true);
    getDevices(user!.role === "admin" ? undefined : user!.id)
      .then((devs) => {
        setDevices(devs);
        if (devs.length && !initialMac) setSelectedMac(devs[0].mac);
      })
      .finally(() => setLoadingDevices(false));
  }, [user]);

  useEffect(() => {
    if (!selectedMac) return;
    setLoadingTel(true);
    Promise.all([
      getTelemetry(selectedMac),
      getSettings(selectedMac),
    ])
      .then(([tel, s]) => {
        setData(tel);
        setDevSettings(s);
      })
      .finally(() => setLoadingTel(false));
  }, [selectedMac]);

  const filtered = useMemo(() => {
    return data
      .filter((d) => {
        const dt = d.timestamp.slice(0, 10);
        return dt >= startDate && dt <= endDate;
      })
      .map((d) => ({
        ...d,
        time: d.timestamp.slice(11, 19),
      }));
  }, [data, startDate, endDate]);

  const { page, setPage, totalPages, pageData } = usePagination(filtered, 5);

  const latest = filtered[filtered.length - 1];
  const device = devices.find((d) => d.mac === selectedMac);
  const alerts: string[] = [];

  if (device?.status !== "online") {
    alerts.push("Device is offline");
  } else if (latest) {
    if (latest.soil < LOW_SOIL) alerts.push("Soil moisture is low");
    if (latest.temperature > HIGH_TEMP) alerts.push("Temperature is high");
  }

  const ok = alerts.length === 0 && device?.status === "online";

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Telemetry</h1>

      {loadingDevices && <Loader />}

      {!loadingDevices && devices.length === 0 && (
        <p className="text-center text-muted-foreground">No devices available</p>
      )}

      {!loadingDevices && devices.length > 0 && (
        <>
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

          <div className="flex flex-wrap items-end gap-4 mb-4">
            <select
              className="input"
              value={selectedMac}
              onChange={(e) => setSelectedMac(e.target.value)}
            >
              {devices.map((d) => (
                <option key={d.mac} value={d.mac}>
                  {d.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-secondary flex items-center gap-1"
              onClick={() => navigate(`/settings?mac=${selectedMac}`)}
              disabled={!selectedMac}
            >
              <SettingsIcon className="h-4 w-4" /> Edit settings
            </button>

            <label>
              From{" "}
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => {
                  const d = e.target.value;
                  setStartDate(d);
                  if (d > endDate) setEndDate(d);
                  setPage(1);
                }}
              />
            </label>

            <label>
              To{" "}
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => {
                  const d = e.target.value;
                  setEndDate(d);
                  if (d < startDate) setStartDate(d);
                  setPage(1);
                }}
              />
            </label>

            <select
              multiple
              size={Math.min(measurementOptions.length, 6)}
              className="input"
              value={selectedMeasurements}
              onChange={(e) =>
                setSelectedMeasurements(
                  Array.from(e.target.selectedOptions, (o) => o.value)
                )
              }
            >
              {measurementOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {loadingTel && <Loader />}

          {!loadingTel && filtered.length === 0 && (
            <p className="text-center text-muted-foreground">
              No telemetry data for selected period
            </p>
          )}

          {!loadingTel &&
            filtered.length > 0 &&
            selectedMeasurements.length > 0 && (
              <div className="flex justify-center">
                <LineChart width={900} height={320} data={filtered}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) =>
                      `Time: ${label}, Timestamp: ${
                        filtered.find((d) => d.time === label)?.timestamp
                      }`
                    }
                  />
                  {selectedMeasurements.map((m) => (
                    <Line
                      key={m}
                      type="monotone"
                      dataKey={m}
                      dot={false}
                      name={
                        measurementOptions.find((o) => o.value === m)?.label ||
                        m
                      }
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
                    {measurementOptions.map((opt) => (
                      <th
                        key={opt.value}
                        className={clsx(
                          "p-2",
                          selectedMeasurements.includes(opt.value) &&
                            "bg-blue-100"
                        )}
                      >
                        {opt.label}
                      </th>
                    ))}
                    <th className="p-2">Water</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((d) => (
                    <tr key={d.timestamp} className="border-t">
                      <td className="p-2 text-left whitespace-nowrap">
                        {d.time}
                      </td>
                      {measurementOptions.map((opt) => (
                        <td
                          key={opt.value}
                          className={clsx(
                            "p-2 text-center",
                            selectedMeasurements.includes(opt.value) &&
                              "font-semibold bg-blue-50"
                          )}
                        >
                          {opt.value === "tamper"
                            ? d.tamper
                              ? "⚠️"
                              : "OK"
                            : (d[opt.value as keyof Telemetry] as number).toFixed(
                                2
                              )}
                        </td>
                      ))}
                      <td className="p-2 text-center">{waterIcon(d.level)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
