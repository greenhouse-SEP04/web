// src/pages/DeviceListPage.tsx
import React, { useEffect, useState } from "react";
import { getDevices, updateDevice, getUsers } from "@/services/mockApi";
import type { Device, User } from "@/services/mockApi";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";

export default function DeviceListPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const nav = useNavigate();

  // load users once
  useEffect(() => {
    getUsers().then(setAllUsers);
  }, []);

  // load devices on user change
  useEffect(() => {
    getDevices(user!.role === "admin" ? undefined : user!.id).then(
      setDevices
    );
  }, [user]);

  // pagination hook for devices
  const { page, setPage, totalPages, pageData: pagedDevices } =
    usePagination(devices, 5);

  const onOwnerChange = async (dev: Device, userId: number | "") => {
    const updated = await updateDevice(dev.id, {
      ownerId: userId === "" ? null : userId,
    });
    setDevices((ds) =>
      ds.map((d) => (d.id === dev.id ? updated : d))
    );
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Devices</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-2">Name</th>
            <th className="p-2">Status</th>
            <th className="p-2">Owner</th>
          </tr>
        </thead>
        <tbody>
          {pagedDevices.map((dev) => (
            <tr
              key={dev.id}
              className="border-b hover:bg-muted/50 cursor-pointer"
              onClick={() => nav(`/telemetry?mac=${dev.mac}`)}
            >
              <td className="p-2">{dev.name}</td>
              <td className="p-2">
                <span
                  className={
                    dev.status === "online"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {dev.status}
                </span>
              </td>
              <td
                className="p-2"
                onClick={(e) => e.stopPropagation()}
              >
                {user?.role === "admin" ? (
                  <select
                    className="input"
                    value={dev.ownerId ?? ""}
                    onChange={(e) =>
                      onOwnerChange(
                        dev,
                        e.target.value === "" ? "" : +e.target.value
                      )
                    }
                  >
                    <option value="">Unassigned</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  allUsers.find((u) => u.id === dev.ownerId)?.name || "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
