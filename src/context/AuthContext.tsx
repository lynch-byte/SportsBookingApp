import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    getSessionUser,
    initDatabase,
    loginUser,
    registerUser,
    setSession,
    User,
} from "../database/db";

type Result = { ok: boolean; message?: string };

type AuthValue = {
  user: User | null;
  ready: boolean; // false while the database and saved login are loading
  error: string | null;
  login: (phone: string, password: string) => Promise<Result>;
  register: (name: string, phone: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up the database, then restore the saved login (if any)
  useEffect(() => {
    initDatabase()
      .then(getSessionUser)
      .then((u) => setUser(u))
      .then(() => setReady(true))
      .catch((e) => setError(String(e?.message ?? e)));
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await loginUser(phone, password);
    if (res.ok && res.user) {
      await setSession(res.user.id);
      setUser(res.user);
    }
    return { ok: res.ok, message: res.message };
  }, []);

  const register = useCallback(
    async (name: string, phone: string, password: string) => {
      const res = await registerUser(name, phone, password);
      if (res.ok && res.user) {
        await setSession(res.user.id);
        setUser(res.user);
      }
      return { ok: res.ok, message: res.message };
    },
    []
  );

  const logout = useCallback(async () => {
    await setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}