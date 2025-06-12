import React, { useEffect, useState, useMemo } from "react";
import { getDevices, getTelemetry } from "@/services/mockApi";
import type { Device, Telemetry } from "@/services/mockApi";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [selectedMac, setSelectedMac] = useState<string>("");

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>([
    "temperature",
  ]);

  const [data, setData] = useState<Telemetry[]>([]);
  const [page, setPage] = useState<number>(1);
  const rowsPerPage = 5;

  // load devices
  useEffect(() => {
    getDevices(user!.role === "admin" ? undefined : user!.id).then((devs) => {
      setDevices(devs);
      if (devs.length) setSelectedMac(devs[0].mac);
    });
  }, [user]);

  // load telemetry when device changes
  useEffect(() => {
    if (selectedMac) {
      getTelemetry(selectedMac).then(setData);
      setPage(1);
    }
  }, [selectedMac]);

  // ensure endDate ≥ startDate
  const handleStartChange = (d: string) => {
    setStartDate(d);
    if (d > endDate) setEndDate(d);
    setPage(1);
  };
  const handleEndChange = (d: string) => {
    setEndDate(d);
    if (d < startDate) setStartDate(d);
    setPage(1);
  };

  // filter by date range inclusive
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

  // pagination
  const totalPages = Math.max(Math.ceil(filtered.length / rowsPerPage), 1);
  const pageData = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Telemetry</h1>

      {/* controls */}
      <div className="flex flex-wrap gap-4 mb-4">
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

        <label>
          From{" "}
          <input
            type="date"
            className="input"
            value={startDate}
            onChange={(e) => handleStartChange(e.target.value)}
          />
        </label>
        <label>
          To{" "}
          <input
            type="date"
            className="input"
            value={endDate}
            onChange={(e) => handleEndChange(e.target.value)}
          />
        </label>

        <select
          multiple
          size={Math.min(measurementOptions.length, 6)}
          className="input"
          value={selectedMeasurements}
          onChange={(e) =>
            setSelectedMeasurements(
              Array.from(e.target.selectedOptions, (opt) => opt.value)
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

      {/* chart */}
      {filtered.length > 0 && selectedMeasurements.length > 0 && (
        <LineChart width={800} height={300} data={filtered}>
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
                measurementOptions.find((o) => o.value === m)?.label || m
              }
            />
          ))}
        </LineChart>
      )}

      {/* table */}
      <table className="w-full mt-6 text-sm border">
        <thead>
          <tr className="bg-muted/20 text-center">
            <th className="p-2">Time</th>
            {measurementOptions.map((opt) => (
              <th
                key={opt.value}
                className={`p-2 ${
                  selectedMeasurements.includes(opt.value)
                    ? "bg-blue-100"
                    : ""
                }`}
              >
                {opt.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.map((d) => (
            <tr key={d.timestamp} className="border-t">
              <td className="p-2 text-left">{d.time}</td>
              {measurementOptions.map((opt) => (
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
                    : (d[opt.value as keyof Telemetry] as number).toFixed(
                        2
                      )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* pagination */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="p-2 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          className="p-2 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
