// src/pages/UserManagementPage.tsx
import { useEffect, useState } from "react";
import { getUsers, addUser, updateUser } from "@/services/mockApi";
import type { User } from "@/services/mockApi";

export default function UserManagementPage() {
  const [data, setData] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "user" as "user" | "admin",
  });

  useEffect(() => {
    getUsers().then(setData);
  }, []);

  const create = async () => {
    if (!newUser.username || !newUser.password) return;
    const u = await addUser(newUser);
    setData(ds => [...ds, u]);
    setNewUser({ name: "", username: "", password: "", role: "user" });
  };

  const toggleRole = async (u: User) => {
    const updated = await updateUser(u.id, {
      role: u.role === "admin" ? "user" : "admin",
    });
    setData(ds => ds.map(x => (x.id === u.id ? updated : x)));
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Users</h1>

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Username</th>
            <th className="p-2">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(u => (
            <tr key={u.id} className="border-b hover:bg-muted/50">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.username}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => toggleRole(u)}
                >
                  Toggle Role
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-medium mb-2">Add New User</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input
          placeholder="Name"
          className="input"
          value={newUser.name}
          onChange={e =>
            setNewUser({ ...newUser, name: e.target.value })
          }
        />
        <input
          placeholder="Username"
          className="input"
          value={newUser.username}
          onChange={e =>
            setNewUser({ ...newUser, username: e.target.value })
          }
        />
        <input
          type="password"
          placeholder="Password"
          className="input"
          value={newUser.password}
          onChange={e =>
            setNewUser({ ...newUser, password: e.target.value })
          }
        />
        <select
          className="input"
          value={newUser.role}
          onChange={e =>
            setNewUser({
              ...newUser,
              role: e.target.value as "user" | "admin",
            })
          }
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button className="btn btn-primary" onClick={create}>
        Create User
      </button>
    </div>
  );
}
