// src/pages/TelemetryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listDevices as getDevices,
  getTelemetry,
  getSettings,
  getTelemetryRange,
} from "@/services/api";
import type {
  DeviceDto    as Device,
  TelemetryDto as Telemetry,
  SettingsDto  as Settings,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";
import clsx from "clsx";
import { Settings as SettingsIcon, CalendarRange } from "lucide-react";
import Loader from "@/components/Loader";
/* ─────────────────────── helpers ─────────────────────── */
import { waterIcon, inWindow } from '@/utils/telemetry';


/* ─────────────────────── constants ─────────────────────── */
/**
 * NOTE: we added a dedicated `tamper` key (boolean rendered as 0/1) so we can
 *  keep the column in the table while still letting the chart treat it as a
 *  numeric spike, just like `motionFlag`.
 */
export type MeasurementKey =
  | "temperature"
  | "humidity"
  | "soil"
  | "lux"
  | "level"          // water-level numeric
  | "motionFlag"     // numeric spike (0/1)
  | "tamper"         // boolean → numeric 0/1
  | "accelX"
  | "accelY"
  | "accelZ";

/* friendly labels */
export const measurementOptions: { value: MeasurementKey; label: string }[] = [
  { value: "temperature", label: "Temperature (°C)" },
  { value: "humidity",    label: "Humidity (%)"    },
  { value: "soil",        label: "Soil (%)"        },
  { value: "lux",         label: "Lux"             },
  { value: "level",       label: "Water level (%)" },
  { value: "motionFlag",  label: "Motion"          },
  { value: "tamper",      label: "Tamper"          },
  { value: "accelX",      label: "Tamper X (g)"    },
  { value: "accelY",      label: "Tamper Y (g)"    },
  { value: "accelZ",      label: "Tamper Z (g)"    },
];

/* colour palette used for header/cell highlights + line strokes  */
const colourMap: Record<MeasurementKey, { hdr: string; cell: string; stroke: string }> = {
  temperature: { hdr: "bg-red-100",   cell: "bg-red-50",   stroke: "#ef4444" },
  humidity:    { hdr: "bg-blue-100",  cell: "bg-blue-50",  stroke: "#3b82f6" },
  soil:        { hdr: "bg-green-100", cell: "bg-green-50", stroke: "#10b981" },
  lux:         { hdr: "bg-yellow-100",cell: "bg-yellow-50",stroke: "#eab308" },
  level:       { hdr: "bg-cyan-100",  cell: "bg-cyan-50", stroke: "#06b6d4" },
  motionFlag:  { hdr: "bg-purple-100",cell: "bg-purple-50",stroke: "#a855f7" },
  tamper:      { hdr: "bg-rose-100",  cell: "bg-rose-50", stroke: "#f43f5e" },
  accelX:      { hdr: "bg-amber-100", cell: "bg-amber-50",stroke: "#f59e0b" },
  accelY:      { hdr: "bg-lime-100",  cell: "bg-lime-50", stroke: "#84cc16" },
  accelZ:      { hdr: "bg-pink-100",  cell: "bg-pink-50", stroke: "#ec4899" },
};

const LOW_SOIL  = 30;
const HIGH_TEMP = 30;



/* ─────────────────────── DateInput helper ─────────────────────── */
interface DateInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  className?: string;
}

const DateInput = ({
  label, value, onChange, min, max, className,
}: DateInputProps) => (
  <label className={clsx("flex flex-col text-xs gap-0.5", className)}>
    {label}
    <input
      type="date"
      className="input h-8 rounded border px-2 shadow-sm w-full"
      value={value}
      onChange={e => onChange(e.target.value)}
      min={min}
      max={max}
    />
  </label>
);

/* ─────────────────────── component ─────────────────────── */
type DeviceWithStatus = Device & { status: "online" | "offline" };

export default function TelemetryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mac }  = useParams<{ mac?: string }>();
  const selectedMac = mac ?? "";

  /* ───── state ───── */
  const [devices, setDevices]         = useState<DeviceWithStatus[]>([]);
  const [data, setData]               = useState<Telemetry[]>([]);
  const [devSettings, setDevSettings] = useState<Settings | null>(null);
  const [loadingDevices, setLoadingDev] = useState(true);
  const [loadingTel, setLoadingTel]     = useState(false);
  const [selectedMeasurements, setSelectedMeasurements] =
    useState<MeasurementKey[]>(["temperature"]);

  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");

  /* ───── load device list + status ───── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingDev(true);
      try {
        const base = await getDevices();
        const enriched: DeviceWithStatus[] = await Promise.all(
          base.map(async d => {
            let online = false;
            try {
              online = (await getTelemetryRange(d.mac)).online;
            } catch { /* ignore network errors per-device */ }
            return { ...d, status: online ? "online" : "offline" };
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
      navigate(`/telemetry/${encodeURIComponent(devices[0].mac)}`, { replace: true });
    }
  }, [selectedMac, loadingDevices, devices, navigate]);

  /* ───── load telemetry + settings (+ range) ───── */
  useEffect(() => {
    if (!selectedMac) return;
    (async () => {
      setLoadingTel(true);
      try {
        const [tel, s, range] = await Promise.all([
          getTelemetry(selectedMac, 1000),
          getSettings(selectedMac),
          getTelemetryRange(selectedMac),
        ]);

        setData(tel);
        setDevSettings(s);

        // update status of the currently-viewed device in the list
        setDevices(ds =>
          ds.map(d =>
            d.mac === selectedMac
              ? { ...d, status: range.online ? "online" : "offline" }
              : d
          )
        );

        // initialise the date pickers only once per device
        if (!startDate && !endDate) {
          const lastTelTs = tel.length ? tel[tel.length - 1].timestamp : undefined;
          const firstTs   = range.first ?? lastTelTs ?? new Date().toISOString();
          const lastTs    = range.online
            ? new Date().toISOString()
            : range.last ?? (tel.length ? tel[0].timestamp : undefined) ?? new Date().toISOString();

          setStartDate(firstTs.slice(0, 10));
          setEndDate(lastTs.slice(0, 10));
        }
      } catch (err) {
        console.error("Failed to load telemetry/settings", err);
      } finally {
        setLoadingTel(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMac]);

  /* ───── derive filtered data ───── */
  const filtered = useMemo(() => {
    if (!startDate || !endDate) return [];
    return data
      .filter(d => {
        const dt = d.timestamp.slice(0, 10);
        return dt >= startDate && dt <= endDate;
      })
      .map(d => ({
        ...d,
        time    : d.timestamp.slice(11, 19),
        dateTime: d.timestamp.replace("T", " ").slice(0, 19),

        motionFlag: d.motion ? 1 : 0,
        tamper   : d.tamper ? 1 : 0, // numeric for chart
      }));
  }, [data, startDate, endDate]);

  const { page, setPage, totalPages, pageData } = usePagination(filtered, 8);
  const latest  = filtered.length ? filtered[filtered.length - 1] : undefined;
  const device  = devices.find(d => d.mac === selectedMac);

  /* ───── alerts ───── */
  const alerts: string[] = [];
  if (device && device.status !== "online") alerts.push("Device is offline");
  else if (latest) {
    if (latest.soil < LOW_SOIL) alerts.push("Soil moisture is low");
    if (latest.temperature > HIGH_TEMP) alerts.push("Temperature is high");
  }
  const ok = alerts.length === 0 && device?.status === "online";

  /* ───── alarm events ───── */
  const alarmEvents = useMemo(() => {
    if (!devSettings?.security?.armed) return [];
    const { start, end } = devSettings.security.alarmWindow;
    return filtered.filter(d =>
      (d.motion || d.tamper) &&
      inWindow(d.timestamp.slice(11, 16), start, end)
    );
  }, [filtered, devSettings]);

  /* ───── render ───── */
  if (loadingDevices) return <Loader />;
  if (!selectedMac)   return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">
        Telemetry • {device?.name ?? selectedMac}
      </h1>

      {device && (
        <div
          className={clsx(
            "mb-6 rounded-md p-3 text-sm",
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
        <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <strong>Alarm triggered</strong> {alarmEvents.length} time
          {alarmEvents.length > 1 && "s"}: {" "}
          {alarmEvents
            .slice(-5)
            .map(e => e.timestamp.replace("T", " ").slice(0, 19))
            .join(" · ")}
        </div>
      )}

      {/* ───────── toolbar ───────── */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        {/* device selector */}
        <div className="flex items-end gap-2 w-full">
          <select
            className="input h-9 rounded border px-2 shadow-sm flex-1"
            value={selectedMac}
            onChange={e =>
              navigate(`/telemetry/${encodeURIComponent(e.target.value)}`)
            }
          >
            {devices.map(d => (
              <option key={d.mac} value={d.mac}>{d.name}</option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-outline-primary h-9 flex items-center gap-1 whitespace-nowrap"
            onClick={() =>
              navigate(`/settings/${encodeURIComponent(selectedMac)}`)
            }
          >
            <SettingsIcon className="h-4 w-4" />
            Edit settings
          </button>
        </div>

        {/* measurement selector */}
        <select
          multiple
          size={measurementOptions.length}
          className="input h-28 min-w-[8rem] rounded border px-2 shadow-sm"
          value={selectedMeasurements}
          onChange={e =>
            setSelectedMeasurements(
              Array.from(e.target.selectedOptions, o => o.value as MeasurementKey)
            )
          }
        >
          {measurementOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* date range */}
        <div className="flex-1 flex items-end gap-3 rounded border bg-white p-2 shadow-sm">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          <div className="flex w-full gap-3">
            <DateInput
              className="flex-1"
              label="From"
              value={startDate}
              onChange={setStartDate}
              max={endDate}
            />
            <DateInput
              className="flex-1"
              label="To"
              value={endDate}
              onChange={setEndDate}
              min={startDate}
            />
          </div>
        </div>
      </div>

      {/* chart */}
      {!loadingTel && filtered.length > 0 && selectedMeasurements.length > 0 && (
        <div className="flex justify-center">
          <LineChart width={900} height={320} data={filtered}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="main" />
            {/* separate axis for 0/1 flags */}
            <YAxis
              yAxisId="flags"
              orientation="right"
              domain={[0, 1]}
              tickFormatter={(v) => (v ? "On" : "Off")}
            />
            <Tooltip
              labelFormatter={label =>
                `Time: ${label}, Timestamp: ${
                  filtered.find(d => d.time === label)?.dateTime
                }`
              }
            />
            {selectedMeasurements.map(m => (
              <Line
                key={m}
                type={["motionFlag", "tamper"].includes(m) ? "stepAfter" : "monotone"}
                dataKey={m}
                dot={false}
                yAxisId={["motionFlag", "tamper"].includes(m) ? "flags" : "main"}
                strokeDasharray={["motionFlag", "tamper"].includes(m) ? "5 5" : undefined}
                stroke={colourMap[m].stroke}
                name={measurementOptions.find(o => o.value === m)?.label}
              />
            ))}
          </LineChart>
        </div>
      )}

      {/* table */}
      {!loadingTel && filtered.length > 0 && (
        <>
          <table className="mt-6 w-full text-sm border">
            <thead className="bg-muted/20 text-center">
              <tr>
                <th className="p-2">Timestamp</th>
                {measurementOptions.map(opt => (
                  <th
                    key={opt.value}
                    className={clsx(
                      "p-2",
                      selectedMeasurements.includes(opt.value) && colourMap[opt.value].hdr
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
                  <td className="p-2 font-mono whitespace-nowrap">{d.dateTime}</td>
                  {measurementOptions.map(opt => {
                    const isMotion = opt.value === "motionFlag" && d.motion;
                    const isTamper = opt.value === "tamper" && d.tamper;
                    return (
                      <td
                        key={opt.value}
                        className={clsx(
                          "p-2 text-center",
                          selectedMeasurements.includes(opt.value) && colourMap[opt.value].cell,
                          (isMotion || isTamper) && "bg-red-200 text-red-800 font-semibold"
                        )}
                      >
                        {["motionFlag", "tamper"].includes(opt.value)
                          ? (opt.value === "motionFlag" ? d.motion : d.tamper)
                              ? "⚠️" : "OK"
                          : Number((d as any)[opt.value as keyof typeof d]).toFixed(2)}
                      </td>
                    );
                  })}
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
    </div>
  );
}
