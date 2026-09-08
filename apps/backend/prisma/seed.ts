import { PrismaClient, GlobalRole, TenantRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Super Admin global del SaaS
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@iglesias-saas.com' },
    update: {},
    create: {
      email: 'superadmin@iglesias-saas.com',
      fullName: 'Super Admin',
      globalRole: GlobalRole.SUPER_ADMIN,
    },
  });

  // Tenant de demostración
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'parroquia-san-jose' },
    update: {},
    create: {
      name: 'Parroquia San José',
      slug: 'parroquia-san-jose',
      timezone: 'America/Bogota',
      currency: 'COP',
    },
  });

  const incomeCategories = ['Colectas', 'Donaciones', 'Intenciones de misa', 'Actividades', 'Venta', 'Otros'];
  const expenseCategories = ['Servicios', 'Mantenimiento', 'Personal', 'Compras', 'Ayudas', 'Transporte', 'Actividades', 'Otros'];

  for (const name of incomeCategories) {
    await prisma.category.upsert({
      where: { tenantId_type_name: { tenantId: tenant.id, type: 'INCOME', name } },
      update: {},
      create: { tenantId: tenant.id, type: 'INCOME', name },
    });
  }
  for (const name of expenseCategories) {
    await prisma.category.upsert({
      where: { tenantId_type_name: { tenantId: tenant.id, type: 'EXPENSE', name } },
      update: {},
      create: { tenantId: tenant.id, type: 'EXPENSE', name },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@parroquia-san-jose.com' },
    update: {},
    create: { email: 'admin@parroquia-san-jose.com', fullName: 'María González' },
  });

  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: admin.id, tenantId: tenant.id } },
    update: {},
    create: { userId: admin.id, tenantId: tenant.id, role: TenantRole.ADMIN },
  });

  const now = new Date();
  await prisma.accountingPeriod.upsert({
    where: { tenantId_year_month: { tenantId: tenant.id, year: now.getFullYear(), month: now.getMonth() + 1 } },
    update: {},
    create: { tenantId: tenant.id, year: now.getFullYear(), month: now.getMonth() + 1 },
  });

  // eslint-disable-next-line no-console
  console.log('Seed completado:', { superAdmin: superAdmin.email, tenant: tenant.slug, admin: admin.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
