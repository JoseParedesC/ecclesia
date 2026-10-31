import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { AppShell } from "./components/layout/AppShell";
import { ConfirmProvider, Spinner, ToastProvider } from "./components/ui";
import Login from "./pages/Login";
import Manual from "./pages/Manual";
import Masters from "./pages/Masters";
import MovementEdit from "./pages/MovementEdit";
import Movements from "./pages/Movements";
import Periods from "./pages/Periods";
import Reports from "./pages/Reports";
import UserEdit from "./pages/UserEdit";
import Users from "./pages/Users";
import { ThemeProvider } from "./theme/ThemeProvider";

function Gate() {
  const { me, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-primary_"><Spinner className="h-7 w-7" /></div>;
  if (!me) return <Login />;
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/periods" element={<Periods />} />
        <Route path="/incomes" element={<Movements kind="incomes" />} />
        <Route path="/incomes/new" element={<MovementEdit kind="incomes" />} />
        <Route path="/incomes/:id/edit" element={<MovementEdit kind="incomes" />} />
        <Route path="/expenses" element={<Movements kind="expenses" />} />
        <Route path="/expenses/new" element={<MovementEdit kind="expenses" />} />
        <Route path="/expenses/:id/edit" element={<MovementEdit kind="expenses" />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/masters" element={<Masters />} />
        {me.creatableRoles.length > 0 ? (
          <>
            <Route path="/users" element={<Users />} />
            <Route path="/users/new" element={<UserEdit />} />
            <Route path="/users/:id/edit" element={<UserEdit />} />
          </>
        ) : (
          <Route path="/users/*" element={<Navigate to="/periods" replace />} />
        )}
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
