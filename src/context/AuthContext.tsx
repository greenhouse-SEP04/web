import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import {
  login as apiLogin,
  logout as apiLogout,
  bootstrapAuth,
  setAuthToken,
  listUsers,
  resetOwnPassword,
} from "@/services/api";
import type { UserDto } from "@/services/api";

import { jwtDecode } from "jwt-decode";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
export interface AuthUser extends UserDto {
  /** roles parsed from the JWT, e.g. ["Admin", "User"] */
  roles: string[];
}

interface AuthCtx {
  user: AuthUser | null;
  authed: boolean;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPwd: string | null, newPwd: string) => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */
const Ctx = createContext<AuthCtx>({} as AuthCtx);
const USER_KEY = "user";

/* JWT claims (what ASP-NET emits by default) */
interface JwtClaims {
  sub: string;               // user id
  role: string | string[];   // may be string or array
  unique_name?: string;      // username
  name?: string;             // alt username
}

export function AuthProvider({ children }: { children: ReactNode }) {
  /* restore cached user (may be null) */
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const authed = !!user;

  /* keep localStorage in sync */
  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else      localStorage.removeItem(USER_KEY);
  }, [user]);

  /* one-time bootstrap: pick up JWT in localStorage → set header */
  useEffect(() => {
    bootstrapAuth();

    /* if we have a token but no user (e.g. page refresh), decode once */
    if (!user) {
      const token = localStorage.getItem("jwt");
      if (!token) return;

      try {
        const claims = jwtDecode<JwtClaims>(token);
        const roles =
          typeof claims.role === "string"
            ? [claims.role]
            : claims.role ?? [];

        const me: AuthUser = {
          id: claims.sub,
          userName: claims.unique_name || claims.name || "",
          isFirstLogin: false,  // unknown until we hit the API
          roles,
        };

        setAuthToken(token);
        setUser(me);
      } catch {
        /* malformed / expired token – wipe everything */
        apiLogout();
        setUser(null);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- login ---------------- */
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      /* 1️⃣  exchange credentials → JWT (api.ts sets LS + header) */
      const token = await apiLogin(username, password);

      /* 2️⃣  decode roles */
      const { sub, role } = jwtDecode<JwtClaims>(token);
      const roles = typeof role === "string" ? [role] : role ?? [];

      /* 3️⃣  Optional: fetch full user for Admins to grab isFirstLogin */
      let profile: UserDto | undefined;
      if (roles.includes("Admin")) {
        profile = (await listUsers()).find(
          (u) => u.id === sub || u.userName === username
        );
      }

      const me: AuthUser = {
        id: sub,
        userName: profile?.userName ?? username,
        isFirstLogin: profile?.isFirstLogin ?? false,
        roles,
      };

      setUser(me);
      return true;
    } catch {
      return false;
    }
  };

  /* ---------------- logout ---------------- */
  const logout = () => {
    apiLogout();       // clears JWT + LS inside api.ts
    setUser(null);
  };

  /* ----------- change password ----------- */
  const changePassword = async (oldPwd: string | null, newPwd: string) => {
    if (!user) return;
    await resetOwnPassword(oldPwd ?? "", newPwd);
  };

  return (
    <Ctx.Provider value={{ user, authed, login, logout, changePassword }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
