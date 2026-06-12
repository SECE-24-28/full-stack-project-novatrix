"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Role } from "@prisma/client";
import { type Permission, hasPermission } from "@/types/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login:  (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole:       (...roles: Role[]) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Refresh helper (calls GraphQL directly to avoid circular Apollo dep) ────

async function fetchNewTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL!, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        query: `
          mutation RefreshToken($token: String!) {
            refreshToken(token: $token) { accessToken refreshToken }
          }
        `,
        variables: { token: refreshToken },
      }),
    });
    const json = await res.json() as { data?: { refreshToken: { accessToken: string; refreshToken: string } } };
    return json.data?.refreshToken ?? null;
  } catch {
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  user:         "iwms:user",
  accessToken:  "iwms:at",
  refreshToken: "iwms:rt",
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,        setUser]        = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Schedule silent token refresh 1 min before expiry ────────────────────
  const scheduleRefresh = useCallback((expiresInMs: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = Math.max(expiresInMs - 60_000, 0);
    refreshTimerRef.current = setTimeout(async () => {
      const rt = localStorage.getItem(STORAGE_KEYS.refreshToken);
      if (!rt) return;
      const tokens = await fetchNewTokens(rt);
      if (tokens) {
        localStorage.setItem(STORAGE_KEYS.accessToken,  tokens.accessToken);
        localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
        setAccessToken(tokens.accessToken);
        document.cookie = `accessToken=${tokens.accessToken}; path=/; max-age=900; SameSite=Strict`;
        scheduleRefresh(14 * 60 * 1000); // schedule next at 14m (15m token)
      }
    }, delay);
  }, []);

  // ── Rehydrate from localStorage on mount ─────────────────────────────────
  useEffect(() => {
    const storedUser  = localStorage.getItem(STORAGE_KEYS.user);
    const storedToken = localStorage.getItem(STORAGE_KEYS.accessToken);

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser) as AuthUser);
      setAccessToken(storedToken);
      scheduleRefresh(14 * 60 * 1000);
    }
    setIsLoading(false);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  // ── Login: persist tokens + sync cookie for middleware ───────────────────
  const login = useCallback(
    (user: AuthUser, at: string, rt: string) => {
      localStorage.setItem(STORAGE_KEYS.user,         JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.accessToken,  at);
      localStorage.setItem(STORAGE_KEYS.refreshToken, rt);
      // Sync to cookie so Next.js middleware can read it (not HttpOnly = client-writable)
      document.cookie = `accessToken=${at}; path=/; max-age=900; SameSite=Strict`;
      setUser(user);
      setAccessToken(at);
      scheduleRefresh(14 * 60 * 1000);
    },
    [scheduleRefresh]
  );

  // ── Logout: wipe everything ──────────────────────────────────────────────
  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    document.cookie = "accessToken=; path=/; max-age=0";
    setUser(null);
    setAccessToken(null);
  }, []);

  const checkPermission = useCallback(
    (permission: Permission) => !!user && hasPermission(user.role, permission),
    [user]
  );

  const checkRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission: checkPermission,
        hasRole:       checkRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
