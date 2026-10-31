import { useAuth } from "../auth";
import { Brand } from "../components/layout/Brand";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { Alert, Button, Card, CardBody } from "../components/ui";

export default function Login() {
  const { login, error } = useAuth();
  return (
    <div className="relative grid min-h-screen place-items-center p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <Card className="w-full max-w-sm animate-scale-in shadow-card">
        <CardBody className="flex flex-col gap-5 p-7">
          <Brand />
          <div>
            <h1 className="text-2xl">Bienvenido</h1>
            <p className="mt-1 text-sm text-muted">Ingresa con la cuenta de Google que registró el administrador.</p>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <Button variant="primary" onClick={login} className="w-full">Ingresar con Google</Button>
        </CardBody>
      </Card>
    </div>
  );
}
