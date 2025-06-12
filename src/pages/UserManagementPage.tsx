// src/pages/UserManagementPage.tsx
import { useEffect, useState } from "react";
import { getUsers, addUser, updateUser } from "@/services/mockApi";
import type { User } from "@/services/mockApi";
import toast from "react-hot-toast";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";

export default function UserManagementPage() {
  const [data, setData] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "user" as "user" | "admin",
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    role: "user" as "user" | "admin",
  });

  // load users
  useEffect(() => {
    getUsers().then(setData);
  }, []);

  // pagination for users
  const { page, setPage, totalPages, pageData: pagedUsers } =
    usePagination(data, 5);

  const create = async () => {
    if (!newUser.username || !newUser.password) return;
    const u = await addUser(newUser);
    setData((ds) => [...ds, u]);
    toast.success("User created");
    setNewUser({ name: "", username: "", password: "", role: "user" });
  };

  const toggleRole = async (u: User) => {
    const updated = await updateUser(u.id, {
      role: u.role === "admin" ? "user" : "admin",
    });
    setData((ds) => ds.map((x) => (x.id === u.id ? updated : x)));
    toast.success("Role toggled");
  };

  const startEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({ name: u.name, username: u.username, role: u.role });
  };

  const cancelEdit = () => {
    setEditingUser(null);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    const updated = await updateUser(editingUser.id, {
      name: editForm.name,
      username: editForm.username,
      role: editForm.role,
    });
    setData((ds) => ds.map((u) => (u.id === updated.id ? updated : u)));
    toast.success("User updated");
    setEditingUser(null);
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
          {pagedUsers.map((u) => (
            <tr key={u.id} className="border-b hover:bg-muted/50">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.username}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => toggleRole(u)}
                  >
                    Toggle Role
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => startEdit(u)}
                  >
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Edit existing user */}
      {editingUser && (
        <div className="bg-background shadow p-4 rounded mb-6">
          <h2 className="text-lg font-medium mb-2">Edit User</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              placeholder="Name"
              className="input"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <input
              placeholder="Username"
              className="input"
              value={editForm.username}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, username: e.target.value }))
              }
            />
            <select
              className="input"
              value={editForm.role}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  role: e.target.value as "user" | "admin",
                }))
              }
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={saveEdit}>
              Save Changes
            </button>
            <button className="btn" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add new user */}
      <h2 className="text-lg font-medium mb-2">Add New User</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input
          placeholder="Name"
          className="input"
          value={newUser.name}
          onChange={(e) =>
            setNewUser((u) => ({ ...u, name: e.target.value }))
          }
        />
        <input
          placeholder="Username"
          className="input"
          value={newUser.username}
          onChange={(e) =>
            setNewUser((u) => ({ ...u, username: e.target.value }))
          }
        />
        <input
          type="password"
          placeholder="Password"
          className="input"
          value={newUser.password}
          onChange={(e) =>
            setNewUser((u) => ({ ...u, password: e.target.value }))
          }
        />
        <select
          className="input"
          value={newUser.role}
          onChange={(e) =>
            setNewUser((u) => ({
              ...u,
              role: e.target.value as "user" | "admin",
            }))
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
