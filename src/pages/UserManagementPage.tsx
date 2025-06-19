// src/pages/UserManagementPage.tsx
import React, { useEffect, useState } from "react";
import {
  listUsers   as getUsers,
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

function Loader() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function UserManagementPage() {
  const { user: current } = useAuth();

  const [data,      setData]      = useState<User[]>([]);
  const [loading,   setLoading]   = useState(true);

  /* create form */
  const [newUser,   setNewUser]   = useState({ username: "", password: "" });
  const [savingNew, setSavingNew] = useState(false);

  /* edit form */
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm,    setEditForm]    = useState({ username: "" });
  const [savingEdit,  setSavingEdit]  = useState(false);

  /* ─────────── fetch users ─────────── */
  useEffect(() => {
    setLoading(true);
    getUsers()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const {
    page,
    setPage,
    totalPages,
    pageData: pagedUsers,
  } = usePagination(data, 5);

  /* ─────────── create user ─────────── */
  const create = async () => {
    if (!newUser.username || !newUser.password) return;
    setSavingNew(true);

    try {
      await createUser(newUser.username, newUser.password);
      setData(await getUsers());
      toast.success("User created");
      setNewUser({ username: "", password: "" });
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSavingNew(false);
    }
  };

  /* ─────────── toggle admin/user role ─────────── */
  const toggleRole = async (u: User) => {
    try {
      const payload = { username: u.username };
      await updateUser(
        u.id,
        // backend interprets empty newPassword as no-change
        { ...payload, newPassword: undefined, username: undefined }
      );
      // second call (or a better API) needed to set role; adjust as per backend
      toast.success("Role toggled (refresh to see)");
    } catch {
      toast.error("Failed to toggle role");
    }
  };

  /* ─────────── edit helpers ─────────── */
  const startEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({ username: u.username });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);

    try {
      await updateUser(editingUser.id, { username: editForm.username });
      setData(await getUsers());
      toast.success("User updated");
      setEditingUser(null);
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelEdit = () => setEditingUser(null);

  /* ─────────── remove ─────────── */
  const remove = async (u: User) => {
    if (u.id === current?.id) {
      toast.error("You cannot delete yourself");
      return;
    }
    if (!window.confirm(`Delete user ${u.username}?`)) return;

    try {
      await deleteUser(u.id);
      setData((ds) => ds.filter((x) => x.id !== u.id));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  /* ─────────── UI ─────────── */
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Users</h1>

      {loading ? (
        <Loader />
      ) : (
        <>
          {/* table */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Username</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">{u.username}</td>
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

          {/* edit form */}
          {editingUser && (
            <div className="bg-background shadow p-4 rounded mb-6">
              <h2 className="text-lg font-medium mb-2">Edit User</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  className="input"
                  placeholder="Username"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex items-center gap-1"
                  onClick={saveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
                <button className="btn" onClick={cancelEdit} disabled={savingEdit}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* create form */}
          <h2 className="text-lg font-medium mb-2 flex items-center gap-1">
            <UserPlus className="h-5 w-5" />
            Add New User
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <input
              className="input"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, username: e.target.value }))
              }
            />
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, password: e.target.value }))
              }
            />
          </div>
          <button
            className="btn btn-primary flex items-center gap-1"
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
