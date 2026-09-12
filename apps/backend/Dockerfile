# node:20-alpine usa musl (no glibc) y las versiones recientes de Alpine no
# traen libssl 1.1 preinstalado, lo que hace que el motor de Prisma no pueda
# detectar la versión de OpenSSL correcta ("Prisma failed to detect the
# libssl/openssl version"). Se usa node:20-slim (Debian) en su lugar,
# instalando openssl explícitamente, para evitar por completo ese problema.
FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
