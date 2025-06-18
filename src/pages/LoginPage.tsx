import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
 const { authed, user, login } = useAuth();
  const [form, setForm] = useState({ u: "", p: "", error: "" });
  const [loading, setLoading] = useState(false);

 if (authed && user?.firstLogin) return <Navigate to="/reset" replace />;
 if (authed) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await login(form.u, form.p);
      if (ok) {
        toast.success("Login successful!");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <form onSubmit={submit} className="bg-background shadow-lg rounded-lg p-8 w-96 space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <input
          placeholder="Username"
          className="w-full input"
          value={form.u}
          onChange={e => setForm({ ...form, u: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full input"
          value={form.p}
          onChange={e => setForm({ ...form, p: e.target.value })}
        />
        {form.error && <p className="text-red-500 text-sm">{form.error}</p>}
        <button
          type="submit"
          className="btn btn-primary w-full flex items-center justify-center"
          disabled={loading}
        >
          {loading && (
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
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
