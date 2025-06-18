// src/pages/UserManagementPage.tsx
import React, { useEffect, useState } from "react";
import { getUsers, addUser, updateUser, deleteUser } from "@/services/mockApi";
import type { User } from "@/services/mockApi";
import toast from "react-hot-toast";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Edit2, UserPlus, RotateCw } from "lucide-react";

function Loader() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function UserManagementPage() {
  const { user: current } = useAuth();
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "user" as "user" | "admin",
  });
  const [savingNew, setSavingNew] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    role: "user" as "user" | "admin",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    setLoading(true);
    getUsers()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const { page, setPage, totalPages, pageData: pagedUsers } = usePagination(data, 5);

  const create = async () => {
    if (!newUser.username || !newUser.password) return;
    setSavingNew(true);
    try {
      const u = await addUser(newUser);
      setData((ds) => [...ds, u]);
      toast.success("User created");
      setNewUser({ name: "", username: "", password: "", role: "user" });
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSavingNew(false);
    }
  };

  const toggleRole = async (u: User) => {
    try {
      const updated = await updateUser(u.id, { role: u.role === "admin" ? "user" : "admin" });
      setData((ds) => ds.map((x) => (x.id === u.id ? updated : x)));
      toast.success("Role toggled");
    } catch {
      toast.error("Failed to toggle role");
    }
  };

  const startEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({ name: u.name, username: u.username, role: u.role });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const updated = await updateUser(editingUser.id, editForm);
      setData((ds) => ds.map((u) => (u.id === updated.id ? updated : u)));
      toast.success("User updated");
      setEditingUser(null);
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelEdit = () => setEditingUser(null);

  const remove = async (u: User) => {
    if (u.id === current?.id) {
      toast.error("You cannot delete yourself");
      return;
    }
    const ok = window.confirm(`Delete user ${u.name}?`);
    if (!ok) return;
    try {
      await deleteUser(u.id);
      setData((ds) => ds.filter((x) => x.id !== u.id));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Users</h1>

      {loading ? (
        <Loader />
      ) : (
        <>
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
                        className="btn btn-primary btn-sm flex items-center gap-1"
                        onClick={() => toggleRole(u)}
                      >
                        <RotateCw className="h-4 w-4" />
                        Toggle Role
                      </button>
                      <button
                        className="btn btn-secondary btn-sm flex items-center gap-1"
                        onClick={() => startEdit(u)}
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        className="btn btn-destructive btn-sm flex items-center gap-1"
                        disabled={u.id === current?.id}
                        onClick={() => remove(u)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

          {editingUser && (
            <div className="bg-background shadow p-4 rounded mb-6">
              <h2 className="text-lg font-medium mb-2">Edit User</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  className="input"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Username"
                  value={editForm.username}
                  onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                />
                <select
                  className="input"
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as "user" | "admin" }))}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex items-center gap-1"
                  onClick={saveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit && (
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8h4z"
                      />
                    </svg>
                  )}
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
                <button className="btn" onClick={cancelEdit} disabled={savingEdit}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <h2 className="text-lg font-medium mb-2 flex items-center gap-1">
            <UserPlus className="h-5 w-5" />
            Add New User
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <input
              className="input"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser((u) => ({ ...u, username: e.target.value }))}
            />
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
            />
            <select
              className="input"
              value={newUser.role}
              onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value as "user" | "admin" }))}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            className="btn btn-primary flex items-center gap-1"
            onClick={create}
            disabled={savingNew}
          >
            {savingNew && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8h4z"
                />
              </svg>
            )}
            {savingNew ? "Creating..." : "Create User"}
          </button>
        </>
      )}
    </div>
  );
}
