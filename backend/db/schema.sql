-- Esquema idempotente: se puede ejecutar varias veces.
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('sacerdote','contador','administrador','secretario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  firebase_uid TEXT UNIQUE,
  email        TEXT NOT NULL,
  name         TEXT,
  role         user_role NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower ON users (lower(email));

-- Categorías en base de datos (no hardcodeadas en la app)
CREATE TABLE IF NOT EXISTS income_categories (
  id SERIAL PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL
);
INSERT INTO income_categories (code, name) VALUES ('INTENCION','Intención'),('DONACION','Donación') ON CONFLICT DO NOTHING;
INSERT INTO expense_categories (code, name) VALUES ('SERVICIO','Servicio'),('GASTO','Gasto') ON CONFLICT DO NOTHING;

-- Maestros
CREATE TABLE IF NOT EXISTS income_types (
  id           SERIAL PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL UNIQUE,
  category_id  INT  NOT NULL REFERENCES income_categories(id),
  account_code TEXT,                       -- cuenta contable (solo la edita el contador)
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   INT REFERENCES users(id),
  updated_by   INT REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS expense_types (
  id           SERIAL PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL UNIQUE,
  category_id  INT  NOT NULL REFERENCES expense_categories(id),
  account_code TEXT,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   INT REFERENCES users(id),
  updated_by   INT REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Períodos contables
CREATE TABLE IF NOT EXISTS periods (
  id          SERIAL PRIMARY KEY,
  year        SMALLINT NOT NULL,
  month       SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  status      TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  opened_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at   TIMESTAMPTZ,
  closed_by   INT REFERENCES users(id),
  reopened_at TIMESTAMPTZ,
  reopened_by INT REFERENCES users(id),
  UNIQUE (year, month)
);
CREATE TABLE IF NOT EXISTS period_events (
  id        SERIAL PRIMARY KEY,
  period_id INT NOT NULL REFERENCES periods(id),
  action    TEXT NOT NULL CHECK (action IN ('OPEN','CLOSE','REOPEN')),
  user_id   INT NOT NULL REFERENCES users(id),
  at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Movimientos
CREATE TABLE IF NOT EXISTS incomes (
  id             SERIAL PRIMARY KEY,
  income_type_id INT NOT NULL REFERENCES income_types(id),
  period_id      INT NOT NULL REFERENCES periods(id),
  date           DATE NOT NULL,
  amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  intention_date DATE,                      -- solo para categoría INTENCION
  description    TEXT,                      -- mención / petición en intenciones
  created_by     INT REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS incomes_period ON incomes(period_id);

CREATE TABLE IF NOT EXISTS expenses (
  id              SERIAL PRIMARY KEY,
  expense_type_id INT NOT NULL REFERENCES expense_types(id),
  period_id       INT NOT NULL REFERENCES periods(id),
  date            DATE NOT NULL,
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  description     TEXT,
  created_by      INT REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS expenses_period ON expenses(period_id);

-- Datos del responsable de cada ingreso/egreso (quien entrega o recibe el dinero).
-- Se agregan como columnas nulas para no romper filas anteriores; la API los exige en registros nuevos y en ediciones.
ALTER TABLE incomes  ADD COLUMN IF NOT EXISTS responsible_name TEXT;
ALTER TABLE incomes  ADD COLUMN IF NOT EXISTS address          TEXT;
ALTER TABLE incomes  ADD COLUMN IF NOT EXISTS id_type          TEXT CHECK (id_type IN ('NIT','CC','TI'));
ALTER TABLE incomes  ADD COLUMN IF NOT EXISTS id_number        TEXT;
ALTER TABLE incomes  ADD COLUMN IF NOT EXISTS contact_phone    TEXT;
ALTER TABLE incomes  ADD COLUMN IF NOT EXISTS email            TEXT;   -- opcional
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS responsible_name TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS address          TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS id_type          TEXT CHECK (id_type IN ('NIT','CC','TI'));
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS id_number        TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS contact_phone    TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS email            TEXT;   -- opcional
CREATE INDEX IF NOT EXISTS incomes_responsible  ON incomes  (id_number);
CREATE INDEX IF NOT EXISTS expenses_responsible ON expenses (id_number);

-- Datos iniciales de ejemplo (editables desde la pantalla de Maestros)
INSERT INTO income_types (code, name, category_id)
  SELECT 'INT-MISA', 'Intención de misa', id FROM income_categories WHERE code='INTENCION' ON CONFLICT DO NOTHING;
INSERT INTO income_types (code, name, category_id)
  SELECT 'DON-COLECTA', 'Colecta dominical', id FROM income_categories WHERE code='DONACION' ON CONFLICT DO NOTHING;
INSERT INTO expense_types (code, name, category_id)
  SELECT 'SRV-PUBLICOS', 'Servicios públicos', id FROM expense_categories WHERE code='SERVICIO' ON CONFLICT DO NOTHING;
INSERT INTO expense_types (code, name, category_id)
  SELECT 'GST-MANTTO', 'Mantenimiento', id FROM expense_categories WHERE code='GASTO' ON CONFLICT DO NOTHING;
