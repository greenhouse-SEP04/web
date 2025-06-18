// src/pages/DeviceListPage.tsx
import React, { useEffect, useState } from "react";
import {
  getDevices,
  updateDevice,
  getUsers,
  getTelemetry,
} from "@/services/mockApi";
import type { Device, User } from "@/services/mockApi";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";
import clsx from "clsx";
import { Settings as SettingsIcon } from "lucide-react";

function Loader() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

interface DeviceWithCreated extends Device {
  createdAt?: string;
}

export default function DeviceListPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceWithCreated[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  /* users for owner dropdown */
  useEffect(() => {
    getUsers().then(setAllUsers);
  }, []);

  /* devices + first telemetry time */
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      const base = await getDevices(user.role === "admin" ? undefined : user.id);
      const enriched = await Promise.all(
        base.map(async (d): Promise<DeviceWithCreated> => {
          try {
            const tel = await getTelemetry(d.mac, 24);
            return { ...d, createdAt: tel[0]?.timestamp };
          } catch {
            return { ...d };
          }
        })
      );
      setDevices(enriched);
      setLoading(false);
    })();
  }, [user]);

  /* pagination */
  const { page, setPage, totalPages, pageData: pagedDevices } = usePagination(devices, 6);

  /* owner change */
  const onOwnerChange = async (dev: DeviceWithCreated, userId: number | "") => {
    const updated = await updateDevice(dev.id, { ownerId: userId === "" ? null : userId });
    setDevices((ds) => ds.map((d) => (d.id === dev.id ? { ...updated, createdAt: d.createdAt } : d)));
  };

  /* ui */
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Devices</h1>
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            {pagedDevices.map((dev) => (
              <div
                key={dev.id}
                className="relative cursor-pointer rounded-lg border bg-background p-4 shadow transition hover:ring-2 hover:ring-primary/50"
                onClick={() => nav(`/telemetry?mac=${dev.mac}`)}
              >
                {/* settings button (top‑right) */}
                <button
                  className="absolute right-2 top-2 rounded p-1 hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    nav(`/settings?mac=${dev.mac}`);
                  }}
                  aria-label="Edit settings"
                >
                  <SettingsIcon className="h-4 w-4" />
                </button>

                {/* name + status */}
                <div className="mb-2 flex items-center justify-between pr-6">{/* leave room for icon */}
                  <h2 className="font-medium">{dev.name}</h2>
                  <span
                    className={clsx(
                      "text-sm font-semibold",
                      dev.status === "online" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {dev.status}
                  </span>
                </div>

                {/* createdAt */}
                <p className="mb-2 text-xs text-muted-foreground">
                  Created: {dev.createdAt ? new Date(dev.createdAt).toLocaleString() : "—"}
                </p>

                {/* owner selector / name */}
                <div onClick={(e) => e.stopPropagation()}>
                  {user?.role === "admin" ? (
                    <select
                      className="input w-full"
                      value={dev.ownerId ?? ""}
                      onChange={(e) => onOwnerChange(dev, e.target.value === "" ? "" : +e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm">{allUsers.find((u) => u.id === dev.ownerId)?.name || "-"}</p>
                  )}
                </div>
              </div>
            ))}

            {pagedDevices.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">No devices found.</p>
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
