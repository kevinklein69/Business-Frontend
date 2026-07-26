# syntax=docker/dockerfile:1

# ---- build: Next.js static export -> out/ ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* wird beim Build fest eingebacken (output: 'export').
# Coolify reicht build-time Env-Vars als Build-Arg rein.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# ---- serve: statische Dateien via nginx ----
FROM nginx:alpine AS runtime
COPY --from=build /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
