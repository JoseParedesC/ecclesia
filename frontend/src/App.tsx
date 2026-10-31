import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { AppShell } from "./components/layout/AppShell";
import { ConfirmProvider, Spinner, ToastProvider } from "./components/ui";
import Login from "./pages/Login";
import Masters from "./pages/Masters";
import Movements from "./pages/Movements";
import Periods from "./pages/Periods";
import Users from "./pages/Users";
import { ThemeProvider } from "./theme/ThemeProvider";

function Gate() {
  const { me, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-primary"><Spinner className="h-7 w-7" /></div>;
  if (!me) return <Login />;
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/periods" element={<Periods />} />
        <Route path="/incomes" element={<Movements kind="incomes" />} />
        <Route path="/expenses" element={<Movements kind="expenses" />} />
        <Route path="/masters" element={<Masters />} />
        <Route path="/users" element={me.creatableRoles.length > 0 ? <Users /> : <Navigate to="/periods" replace />} />
        <Route path="*" element={<Navigate to="/periods" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <AuthProvider>
              <Gate />
            </AuthProvider>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
