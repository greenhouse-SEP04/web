import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { authed, login } = useAuth();
  const [form, setForm] = useState({ u: "", p: "", error: "" });

  if (authed) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const ok = await login(form.u, form.p);
    if (ok) {
      toast.success("Login successful!");
    } else {
      toast.error("Invalid credentials");
    }
  } catch (error) {
    toast.error("An error occurred");
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
        <button className="btn btn-primary w-full">Login</button>
      </form>
    </div>
  );
}
