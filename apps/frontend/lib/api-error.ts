// Error tipado para que la UI pueda distinguir el bloqueo por período
// cerrado (PRD sección 15) de cualquier otro error y mostrar el mensaje
// correcto ("El período de <mes> está cerrado.") sin adivinar el texto.
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }

  get isPeriodClosed() {
    return this.code === 'ACCOUNTING_PERIOD_CLOSED';
  }
}
