import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import Masters from "./pages/Masters";
import Movements from "./pages/Movements";
import Periods from "./pages/Periods";

function Shell() {
  const { me, loading, error, login, logout } = useAuth();
  if (loading) return <p className="center muted">Cargando…</p>;
  if (!me)
    return (
      <main className="login">
        <h1>Finanzas parroquiales</h1>
        <p>Ingresa con la cuenta de Google que registró el administrador.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" onClick={login}>Ingresar con Google</button>
      </main>
    );
  return (
    <>
      <header>
        <strong className="brand">Finanzas parroquiales</strong>
        <nav>
          <NavLink to="/periods">Períodos</NavLink>
          <NavLink to="/incomes">Ingresos</NavLink>
          <NavLink to="/expenses">Egresos</NavLink>
          <NavLink to="/masters">Maestros</NavLink>
        </nav>
        <span className="who">{me.name ?? me.email} · {me.role}</span>
        <button onClick={logout}>Salir</button>
      </header>
      <main>
        <Routes>
          <Route path="/periods" element={<Periods />} />
          <Route path="/incomes" element={<Movements kind="incomes" />} />
          <Route path="/expenses" element={<Movements kind="expenses" />} />
          <Route path="/masters" element={<Masters />} />
          <Route path="*" element={<Navigate to="/periods" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
