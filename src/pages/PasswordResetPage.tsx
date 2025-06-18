// src/pages/PasswordResetPage.tsx
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";


export default function PasswordResetPage() {
  const { user, changePassword } = useAuth();
  const requireCurrent = !user?.firstLogin;        // ✓ single source of truth

  const [currentPwd, setCurrentPwd] = useState(""); // ✓ only used if required
  const [newPwd, setNewPwd]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);

  if (done)   return <Navigate to="/" replace />;

  const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;


    // Generate a 12-char password, fill it in AND copy it
  const generatePassword = async () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPwd(pass);

    try {
      await navigator.clipboard.writeText(pass);
      toast.success("Password copied to clipboard!");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };
  
  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (requireCurrent && currentPwd.trim() === "") {
      toast.error("Please enter your current password.");
      return;
    }
    if (!strong.test(newPwd)) {
      toast.error("Password must be 8+ chars incl. upper, lower, number & special.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(requireCurrent ? currentPwd : null, newPwd);
      toast.success("Password changed!");
      setDone(true);
    } catch (err) {
      const msg = (err as Error).message === "incorrect-old-password"
        ? "Current password is incorrect."
        : "Password change failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <form onSubmit={handle} className="bg-background p-8 rounded-lg shadow w-96 space-y-4">
        {/* current password – rendered only for “change”, not for “first set” */}
        {requireCurrent && (
          <input
            type="password"
            placeholder="Current password"
            className="w-full input"
            value={currentPwd}
            onChange={e => setCurrentPwd(e.target.value)}
            disabled={loading}
          />
        )}

        {/* new password (always) */}
        <div className="relative w-full">
          <input
            type="password"
            placeholder="New password"
            className="w-full input pr-24"
            value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            onClick={generatePassword}
            disabled={loading}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
          >
            Generate
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <>
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
                          {user.firstLogin ? "Setting…" : "Saving…"}
            </>
          ) : (
            user.firstLogin ? "Set & login" : "Save"
          )}
        </button>
      </form>
    </div>
  );
}
