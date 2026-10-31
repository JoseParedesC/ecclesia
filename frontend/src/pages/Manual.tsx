import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Card, CardBody, CardHeader, Table, TableWrap, Td, Th, Tr } from "../components/ui";
import { ROLES } from "../features/users/UserForm";

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <Card id={id} className="scroll-mt-24">
    <CardHeader title={title} />
    <CardBody className="space-y-3 text-sm leading-relaxed [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc [&_b]:font-semibold">{children}</CardBody>
  </Card>
);

const toc = [
  ["login", "Iniciar sesión"], ["roles", "Roles"], ["periodos", "Períodos"], ["movimientos", "Ingresos y egresos"],
  ["maestros", "Maestros"], ["reportes", "Reportes"], ["usuarios", "Usuarios"], ["tema", "Tema"], ["faq", "Mensajes frecuentes"],
] as const;

const faq: [string, string][] = [
  ["«El período … no existe / está cerrado»", "Abre o reabre el período en Períodos."],
  ["«Solo pueden existir 2 períodos abiertos»", "Cierra primero el más antiguo."],
  ["«El registro está en uso y no se puede eliminar»", "Desactívalo en lugar de eliminarlo."],
  ["«Tu cuenta no está autorizada»", "Pide a un administrador que te registre en Usuarios."],
];

/** Manual de usuario (destino de la opción «How to use» del menú). El mismo contenido está en docs/MANUAL_USUARIO.md. */
export default function Manual() {
  return (
    <>
      <PageHeader title="How to use" description="Manual de usuario de Ecclesia: cómo registrar ingresos y egresos, cerrar meses y sacar reportes." />
      <div className="space-y-5">
        <nav aria-label="Contenido" className="flex flex-wrap gap-2 print:hidden">
          {toc.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted shadow-soft transition-colors duration-fast hover:border-primary hover:text-primary_">{label}</a>
          ))}
        </nav>

        <Section id="login" title="1. Iniciar sesión">
          <ol>
            <li>Pulsa <b>Ingresar con Google</b> y usa la cuenta con la que te registraron.</li>
            <li>Si ves «Tu cuenta no está autorizada», pide a un administrador que te agregue en <b>Usuarios</b>.</li>
            <li>Para salir usa <b>Cerrar sesión</b>, al pie del menú lateral.</li>
          </ol>
        </Section>

        <Section id="roles" title="2. Roles y permisos">
          <TableWrap>
            <Table>
              <thead><tr><Th>Rol</Th><Th>Qué puede hacer</Th></tr></thead>
              <tbody>{ROLES.slice().reverse().map((r) => <Tr key={r.value}><Td className="whitespace-nowrap font-medium">{r.label}</Td><Td className="text-muted">{r.hint}</Td></Tr>)}</tbody>
            </Table>
          </TableWrap>
          <p>Solo sacerdote, contador y administrador editan maestros; el secretario los consulta.</p>
        </Section>

        <Section id="periodos" title="3. Períodos">
          <p>Un período es un mes contable. Solo en períodos <b>abiertos</b> se registran, editan o eliminan movimientos.</p>
          <ul>
            <li><b>Abrir:</b> en Períodos, elige año y mes. Máximo <b>2 períodos abiertos</b> a la vez y <b>consecutivos</b>.</li>
            <li><b>Cerrar:</b> el período queda de solo lectura; puedes descargar el consolidado (CSV).</li>
            <li><b>Reabrir:</b> solo sacerdote, contador y administrador. Queda registrado quién y cuándo.</li>
          </ul>
        </Section>

        <Section id="movimientos" title="4. Ingresos y egresos">
          <p><b>Listado.</b> Elige el período, busca por responsable, identificación, tipo o descripción, y filtra por tipo. Usa <b>Nuevo ingreso / Nuevo egreso</b> para crear; el lápiz edita y la papelera elimina (solo en períodos abiertos).</p>
          <p><b>Formulario.</b> Es una pantalla aparte. Datos del movimiento: tipo, fecha (dentro de un período abierto), monto y descripción. Si el tipo es una <b>intención</b>, también son obligatorias la fecha en que se realizará y la mención o petición.</p>
          <p><b>Responsable</b> (quien entrega el dinero, o a quien se le paga):</p>
          <ul>
            <li>Obligatorios: responsable, dirección, tipo de identificación (<b>NIT, CC o TI</b>), número de identificación y teléfono de contacto.</li>
            <li>Opcional: correo.</li>
            <li>CC y TI: solo dígitos. NIT: dígitos con guion y dígito de verificación opcional (ej. <code>900123456-7</code>).</li>
          </ul>
        </Section>

        <Section id="maestros" title="5. Maestros">
          <p>Administran los tipos de ingreso (Intención o Donación) y de egreso (Servicio o Gasto), con código, nombre y cuenta contable.</p>
          <ul>
            <li>La <b>cuenta contable</b> solo la definen el contador y el administrador.</li>
            <li>Un tipo con movimientos no se elimina ni cambia de código o categoría: <b>desactívalo</b>.</li>
          </ul>
        </Section>

        <Section id="reportes" title="6. Reportes">
          <ul>
            <li><b>Ingresos / Egresos:</b> rango de fechas, categoría y tipo, con responsable e identificación.</li>
            <li><b>Intenciones:</b> por fecha de realización o de registro.</li>
            <li><b>Consolidado mensual:</b> ingresos, egresos y saldo del período.</li>
          </ul>
          <p>Con <b>Imprimir</b> se abre el diálogo del navegador; ahí puedes elegir «Guardar como PDF».</p>
        </Section>

        <Section id="usuarios" title="7. Usuarios">
          <p>Solo lo ven los roles que pueden crear usuarios, y cada uno gestiona únicamente los roles que puede crear.</p>
          <ul>
            <li><b>Nuevo usuario:</b> correo de Google exacto, nombre (opcional) y rol.</li>
            <li><b>Editar:</b> nombre y rol. Nadie cambia su propio rol ni se desactiva.</li>
            <li><b>Desactivar:</b> la persona ya no inicia sesión; sus registros se conservan.</li>
          </ul>
        </Section>

        <Section id="tema" title="8. Tema">
          <p>En la barra superior elige tema claro, oscuro o seguir el sistema. Al imprimir siempre se usan colores claros.</p>
        </Section>

        <Section id="faq" title="9. Mensajes frecuentes">
          <TableWrap>
            <Table>
              <thead><tr><Th>Mensaje</Th><Th>Qué hacer</Th></tr></thead>
              <tbody>{faq.map(([m, a]) => <Tr key={m}><Td className="font-medium">{m}</Td><Td className="text-muted">{a}</Td></Tr>)}</tbody>
            </Table>
          </TableWrap>
        </Section>

        <Alert tone="info"><span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />¿Algo no está claro? Pregunta a un administrador de tu parroquia.</span></Alert>
      </div>
    </>
  );
}
