// src/pages/DeviceListPage.tsx
import { useEffect, useState } from "react";
import { getDevices, updateDevice, getUsers } from "@/services/mockApi";
import type { Device, User } from "@/services/mockApi";
import { useAuth } from "@/context/AuthContext";

export default function DeviceListPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load users (for the admin’s owner-assignment dropdown)
    getUsers().then(setAllUsers);

    // Load devices (filtered for non-admins)
    getDevices(user!.role === "admin" ? undefined : user!.id).then(
      setDevices
    );
  }, [user]);

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
          {devices.map((dev) => (
            <tr
              key={dev.id}
              className="border-b hover:bg-muted/50"
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
              <td className="p-2">
                {user?.role === "admin" ? (
                  <select
                    className="input"
                    value={dev.ownerId ?? ""}
                    onChange={(e) =>
                      onOwnerChange(dev, e.target.value === "" ? "" : +e.target.value)
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
    </div>
  );
}
