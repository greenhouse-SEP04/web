// D:\source\web\web\src\pages\PasswordResetPage.tsx
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PasswordResetPage() {
  const { user, changePassword } = useAuth();
  const [pwd, setPwd] = useState("");
  const [done, setDone] = useState(false);

  const strongPwdPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

  const generateStrongPassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPwd(password);
    navigator.clipboard.writeText(password);
    toast.success("Generated password copied to clipboard!");
  };

  if (!user) return <Navigate to="/login" replace />;
  if (done) return <Navigate to="/" replace />;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!strongPwdPattern.test(pwd)) {
      toast.error(
        "Password must be 8+ characters with uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      await changePassword(pwd);
      toast.success("Password changed successfully!");
      setDone(true);
    } catch (error) {
      toast.error("Failed to change password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <form
        onSubmit={handle}
        className="bg-background p-8 rounded-lg shadow w-96 space-y-4"
      >
        <h2 className="text-xl font-semibold">Set new password</h2>
        <input
          type="password"
          placeholder="New password"
          className="w-full input"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-secondary w-full"
          onClick={generateStrongPassword}
        >
          Generate Strong Password
        </button>
        <button className="btn btn-primary w-full">Save</button>
      </form>
    </div>
  );
}
