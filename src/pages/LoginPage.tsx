import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { authed, user, login } = useAuth();

  /* local form state */
  const [form, setForm] = useState({ u: "", p: "" });
  const [loading, setLoading] = useState(false);

  /* redirect if already authenticated */
  if (authed && user?.isFirstLogin) return <Navigate to="/reset" replace />;
  if (authed)                        return <Navigate to="/"     replace />;

  /* submit handler */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const ok = await login(form.u, form.p);
      toast[ok ? "success" : "error"](
        ok ? "Login successful!" : "Invalid credentials"
      );
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  /* UI */
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <form
        onSubmit={submit}
        className="bg-background shadow-lg rounded-lg p-8 w-96 space-y-4"
      >
        <h1 className="text-2xl font-semibold">Sign in</h1>

        <input
          placeholder="Username"
          className="w-full input"
          value={form.u}
          onChange={(e) => setForm({ ...form, u: e.target.value })}
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full input"
          value={form.p}
          onChange={(e) => setForm({ ...form, p: e.target.value })}
          autoComplete="current-password"
        />

        <button
          type="submit"
          className="btn btn-primary w-full flex items-center justify-center"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
