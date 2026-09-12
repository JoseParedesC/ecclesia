FROM node:20-alpine AS base
WORKDIR /app

# Railway (y Docker en general) no exponen las variables de entorno del
# servicio dentro de un build por Dockerfile a menos que se declaren
# explícitamente con ARG. NODE_AUTH_TOKEN es el Personal Access Token de
# GitHub (permiso read:packages) usado por .npmrc para descargar
# @joseparedesc/master-crud desde GitHub Packages.
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN

COPY .npmrc ./
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
