// src/pages/DeviceListPage.tsx
import { useEffect, useState } from "react";
import {
  listDevices   as getDevices,
  listUsers     as getUsers,
  assignDevice,
  deleteDevice,
  getTelemetryRange,             // ← NEW
} from "@/services/api";
import type {
  DeviceDto           as Device,
  UserDto             as User,
  TelemetryRangeDto   as Range,  // ← NEW
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";
import clsx from "clsx";
import { Settings as SettingsIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

/* ───────────────────── Loader ───────────────────── */
const Loader = () => (
  <div className="flex justify-center py-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

/* ───────────────────── Types ───────────────────── */
interface DeviceWithMeta extends Device {
  createdAt?: string;              // first telemetry timestamp
  status: "online" | "offline";    // derived from Range.online
}

export default function DeviceListPage() {
  const { user }  = useAuth();
  const isAdmin   = user?.roles.includes("Admin");
  const [devices, setDevices]   = useState<DeviceWithMeta[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const nav = useNavigate();

  /* ─ users for owner dropdown ─ */
  useEffect(() => { getUsers().then(setAllUsers); }, []);

  /* ─ fetch devices + metadata ─ */
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    (async () => {
      try {
        const base = await getDevices();

        const enriched: DeviceWithMeta[] = await Promise.all(
          base.map(async (d): Promise<DeviceWithMeta> => {
            let range: Range | null = null;
            try { range = await getTelemetryRange(d.mac); } catch {}

            return {
              ...d,
              status    : range?.online ? "online" : "offline",
              createdAt : range?.first ?? undefined,
            };
          })
        );

        setDevices(enriched);
      } catch {
        toast.error("Failed to load devices");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  /* ─ pagination ─ */
  const { page, setPage, totalPages, pageData } = usePagination(devices, 6);

  /* ─ owner change ─ */
  const changeOwner = async (dev: DeviceWithMeta, userId: string | "") => {
    try {
      await assignDevice(dev.mac, userId);
      setDevices(ds =>
        ds.map(d =>
          d.mac === dev.mac
            ? {
                ...d,
                ownerId       : userId || null,
                ownerUserName : allUsers.find(u => u.id === userId)?.userName ?? null,
              }
            : d
        )
      );
      toast.success("Owner updated");
    } catch {
      toast.error("Failed to update owner");
    }
  };

  /* ─ delete ─ */
  const remove = async (mac: string) => {
    if (!window.confirm("Delete this device?")) return;
    try {
      await deleteDevice(mac);
      setDevices(ds => ds.filter(d => d.mac !== mac));
      toast.success("Device deleted");
    } catch {
      toast.error("Failed to delete device");
    }
  };

  /* ───────────────────── UI ───────────────────── */
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Devices</h1>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            {pageData.map(dev => (
              <div
                key={dev.mac}
                className="cursor-pointer rounded-lg border bg-background p-4 shadow transition hover:ring-2 hover:ring-primary/50"
                onClick={() => nav(`/telemetry/${encodeURIComponent(dev.mac)}`)}
              >
                {/* name + icons */}
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="font-medium">{dev.name}</h2>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      className="rounded p-1 hover:bg-muted"
                      onClick={() => nav(`/settings/${encodeURIComponent(dev.mac)}`)}
                      aria-label="Edit settings"
                    >
                      <SettingsIcon className="h-4 w-4" />
                    </button>

                    {isAdmin && (
                      <button
                        className="rounded p-1 text-red-600 hover:bg-muted"
                        onClick={() => remove(dev.mac)}
                        aria-label="Delete device"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* status */}
                <span
                  className={clsx(
                    "mb-2 block text-sm font-semibold",
                    dev.status === "online" ? "text-green-600" : "text-red-600"
                  )}
                >
                  {dev.status}
                </span>

                {/* createdAt */}
                <p className="mb-2 text-xs text-muted-foreground">
                  Created:{" "}
                  {dev.createdAt
                    ? new Date(dev.createdAt).toLocaleString()
                    : "—"}
                </p>

                {/* owner selector / name */}
                <div onClick={e => e.stopPropagation()}>
                  {isAdmin ? (
                    <select
                      className="input w-full"
                      value={dev.ownerId ?? ""}
                      onChange={e => changeOwner(dev, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.userName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm">{dev.ownerUserName ?? "-"}</p>
                  )}
                </div>
              </div>
            ))}

            {pageData.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
                No devices found.
              </p>
            )}
          </div>

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
