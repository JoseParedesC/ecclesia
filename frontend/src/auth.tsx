import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import { auth } from "./firebase";
import type { Me } from "./types";

interface AuthState { me: Me | null; loading: boolean; error: string; login: () => void; logout: () => void }
const Ctx = createContext<AuthState>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        if (!u) { setMe(null); setLoading(false); return; }
        try {
          setMe(await api<Me>("/me"));
          setError("");
        } catch (e) {
          setError((e as Error).message);
          setMe(null);
          await signOut(auth);
        } finally {
          setLoading(false);
        }
      }),
    [],
  );

  const login = () => signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => setError(e.message));
  const logout = () => void signOut(auth);
  return <Ctx.Provider value={{ me, loading, error, login, logout }}>{children}</Ctx.Provider>;
}
