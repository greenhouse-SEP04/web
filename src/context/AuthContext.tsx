import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { mockLogin, mockChangePassword } from "@/services/mockApi";
import type { User } from "@/services/mockApi";

type AuthCtx = {
  user: User | null;
  authed: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPwd: string | null, newPwd: string) => Promise<void>; // ✓
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(
    () => JSON.parse(localStorage.getItem("user") || "null")
  );
  const authed = !!user;

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  const login = async (u: string, p: string) => {
    const res = await mockLogin(u, p);
    if (res) setUser(res);
    return !!res;
  };

  const logout = () => setUser(null);

  const changePassword = async (oldPwd: string | null, newPwd: string) => {
  if (!user) return;
  const updated = await mockChangePassword(user.id, newPwd, oldPwd);
  setUser(updated);
};

  return (
    <Ctx.Provider value={{ user, authed, login, logout, changePassword }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
