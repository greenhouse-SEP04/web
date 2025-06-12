// src/pages/TelemetryPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { getDevices, getTelemetry } from "@/services/mockApi";
import type { Device, Telemetry } from "@/services/mockApi";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useSearchParams } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";

const measurementOptions = [
  { value: "temperature", label: "Temperature (°C)" },
  { value: "humidity", label: "Humidity (%)" },
  { value: "soil", label: "Soil (%)" },
  { value: "lux", label: "Lux" },
  { value: "level", label: "Level" },
  { value: "tamper", label: "Tamper" },
];

export default function TelemetryPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [params] = useSearchParams();
  const initialMac = params.get("mac") || "";
  const [selectedMac, setSelectedMac] = useState(initialMac);

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>([
    "temperature",
  ]);

  const [data, setData] = useState<Telemetry[]>([]);

  // load devices
  useEffect(() => {
    getDevices(user!.role === "admin" ? undefined : user!.id).then((devs) => {
      setDevices(devs);
      if (devs.length && !initialMac) setSelectedMac(devs[0].mac);
    });
  }, [user]);

  // load telemetry when device changes
  useEffect(() => {
    if (!selectedMac) return;
    getTelemetry(selectedMac).then(d => {
      setData(d);
    });
  }, [selectedMac]);

  // date-range filter
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

  // pagination hook
  const { page, setPage, totalPages, pageData } = usePagination(filtered, 5);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Telemetry</h1>

      {/* controls */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* device selector */}
        <select
          className="input"
          value={selectedMac}
          onChange={e => setSelectedMac(e.target.value)}
        >
          {devices.map(d => (
            <option key={d.mac} value={d.mac}>{d.name}</option>
          ))}
        </select>

        {/* date pickers */}
        <label>
          From{" "}
          <input
            type="date"
            className="input"
            value={startDate}
            onChange={e => {
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
            onChange={e => {
              const d = e.target.value;
              setEndDate(d);
              if (d < startDate) setStartDate(d);
              setPage(1);
            }}
          />
        </label>

        {/* measurement multi-select */}
        <select
          multiple
          size={Math.min(measurementOptions.length, 6)}
          className="input"
          value={selectedMeasurements}
          onChange={e =>
            setSelectedMeasurements(
              Array.from(e.target.selectedOptions, o => o.value)
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

      {/* chart */}
      {filtered.length > 0 && selectedMeasurements.length > 0 && (
        <LineChart width={800} height={300} data={filtered}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip
            labelFormatter={(label) =>
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
              name={measurementOptions.find(o => o.value === m)?.label || m}
            />
          ))}
        </LineChart>
      )}

      {/* table */}
      <table className="w-full mt-6 text-sm border">
        <thead>
          <tr className="bg-muted/20 text-center">
            <th className="p-2">Time</th>
            {measurementOptions.map(opt => (
              <th
                key={opt.value}
                className={`p-2 ${
                  selectedMeasurements.includes(opt.value) ? "bg-blue-100" : ""
                }`}
              >
                {opt.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.map(d => (
            <tr key={d.timestamp} className="border-t">
              <td className="p-2 text-left">{d.time}</td>
              {measurementOptions.map(opt => (
                <td
                  key={opt.value}
                  className={`p-2 text-center ${
                    selectedMeasurements.includes(opt.value)
                      ? "font-semibold bg-blue-50"
                      : ""
                  }`}
                >
                  {opt.value === "tamper"
                    ? d.tamper
                      ? "⚠️"
                      : "OK"
                    : (d[opt.value as keyof Telemetry] as number).toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* reusable pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
