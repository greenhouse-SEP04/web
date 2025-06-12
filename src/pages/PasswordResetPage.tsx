import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

export default function PasswordResetPage() {
  const { user, changePassword } = useAuth();
  const [pwd, setPwd] = useState("");
  const [done, setDone] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (done) return <Navigate to="/" replace />;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    await changePassword(pwd);
    setDone(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <form onSubmit={handle} className="bg-background p-8 rounded-lg shadow w-96 space-y-4">
        <h2 className="text-xl font-semibold">Set new password</h2>
        <input
          type="password"
          placeholder="New password"
          className="w-full input"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
        />
        <button className="btn btn-primary w-full">Save</button>
      </form>
    </div>
  );
}
