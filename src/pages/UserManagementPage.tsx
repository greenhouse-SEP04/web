// src/pages/UserManagementPage.tsx
import { useEffect, useState } from "react";
import {
  listUsers as getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/api";
import type { UserDto as User } from "@/services/api";
import toast from "react-hot-toast";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Edit2, UserPlus, RotateCw } from "lucide-react";

import Loader from "@/components/Loader";


export default function UserManagementPage() {
  const { user: current } = useAuth();

  const [data, setData]       = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  /* ─────────── create form ─────────── */
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "User" as "User" | "Admin",
  });
  const [savingNew, setSavingNew] = useState(false);

  /* ─────────── edit form ─────────── */
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm]       = useState({
    username: "",
    newPassword: "",
    role: "User" as "User" | "Admin",
  });
  const [savingEdit, setSavingEdit]   = useState(false);

  /* ─────────── fetch list ─────────── */
  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try { setData(await getUsers()); }
    finally { setLoading(false); }
  };

  const {
    page, setPage, totalPages, pageData: pagedUsers,
  } = usePagination(data, 5);

  /* ─────────── create user ─────────── */
  const create = async () => {
    if (!newUser.username || !newUser.password) return;
    setSavingNew(true);
    try {
      await createUser(newUser.username, newUser.password, newUser.role);
      await fetchUsers();
      toast.success("User created");
      setNewUser({ username: "", password: "", role: "User" });
    } catch { toast.error("Failed to create user"); }
    finally { setSavingNew(false); }
  };

  /* ─────────── toggle role ─────────── */
  const toggleRole = async (u: User) => {
    const isAdmin  = u.roles?.includes("Admin") ?? false;
    const nextRole = isAdmin ? "User" : "Admin";
    try {
      await updateUser(u.id, { role: nextRole });
      await fetchUsers();
      toast.success(`Role changed to ${nextRole}`);
    } catch { toast.error("Failed to change role"); }
  };

  /* ─────────── edit helpers ─────────── */
  const startEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({
      username   : u.userName,
      newPassword: "",
      role       : (u.roles?.includes("Admin") ?? false) ? "Admin" : "User",
    });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      await updateUser(editingUser.id, {
        username   : editForm.username,
        newPassword: editForm.newPassword || undefined,
        role       : editForm.role,
      });
      await fetchUsers();
      toast.success("User updated");
      setEditingUser(null);
    } catch { toast.error("Failed to update user"); }
    finally { setSavingEdit(false); }
  };

  const cancelEdit = () => setEditingUser(null);

  /* ─────────── delete ─────────── */
  const remove = async (u: User) => {
    if (u.id === current?.id) {
      toast.error("You cannot delete yourself");
      return;
    }
    if (!window.confirm(`Delete user ${u.userName}?`)) return;
    try {
      await deleteUser(u.id);
      setData(ds => ds.filter(x => x.id !== u.id));
      toast.success("User deleted");
    } catch { toast.error("Failed to delete user"); }
  };

  /* ───────────────────── UI ───────────────────── */
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Users</h1>

      {loading ? <Loader /> : (
        <>
          {/* list ----------------------------------------------------------- */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Username</th>
                <th className="p-2">Role</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map(u => {
                const isAdmin = u.roles?.includes("Admin") ?? false;
                return (
                  <tr key={u.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{u.userName}</td>
                    <td className="p-2">{isAdmin ? "Admin" : "User"}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {/* Toggle role */}
                        <button
                          className="btn btn-primary btn-sm w-36 flex items-center justify-center gap-1 whitespace-nowrap"
                          onClick={() => toggleRole(u)}
                        >
                          <RotateCw className="h-4 w-4" />
                          {isAdmin ? "Demote" : "Make Admin"}
                        </button>
                        {/* Edit */}
                        <button
                          className="btn btn-secondary btn-sm w-36 flex items-center justify-center gap-1"
                          onClick={() => startEdit(u)}
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        {/* Delete */}
                        <button
                          className="btn btn-destructive btn-sm w-36 flex items-center justify-center gap-1"
                          disabled={u.id === current?.id}
                          onClick={() => remove(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

          {/* edit dialog ---------------------------------------------------- */}
          {editingUser && (
            <div className="bg-background shadow p-4 rounded mb-6">
              <h2 className="text-lg font-medium mb-2">Edit User</h2>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                  className="input flex-1"
                  placeholder="Username"
                  value={editForm.username}
                  onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                />
                <input
                  type="password"
                  className="input flex-1"
                  placeholder="New password (optional)"
                  value={editForm.newPassword}
                  onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                />
                <select
                  className="input flex-1"
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value as "User" | "Admin" }))}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1 flex items-center justify-center gap-1"
                  onClick={saveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
                <button
                  className="btn flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300"
                  onClick={cancelEdit}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* create form ---------------------------------------------------- */}
          <h2 className="text-lg font-medium mb-2 flex items-center gap-1">
            <UserPlus className="h-5 w-5" />
            Add New User
          </h2>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <input
              className="input flex-1"
              placeholder="Username"
              value={newUser.username}
              onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))}
            />
            <input
              type="password"
              className="input flex-1"
              placeholder="Password"
              value={newUser.password}
              onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
            />
            <select
              className="input flex-1"
              value={newUser.role}
              onChange={e => setNewUser(u => ({ ...u, role: e.target.value as "User" | "Admin" }))}
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <button
            className="btn btn-primary w-full flex items-center justify-center gap-1"
            onClick={create}
            disabled={savingNew}
          >
            {savingNew ? "Creating…" : "Create User"}
          </button>
        </>
      )}
    </div>
  );
}
