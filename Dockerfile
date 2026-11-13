# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:24-alpine AS build
WORKDIR /app
# Husky's `prepare` script needs a git repo; skip it in Docker.
ENV HUSKY=0
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Vite bakes this into the static bundle at build time — build ARG, not runtime env.
# Production build HTTPS manzil talab qiladi (vite.config.ts guard).
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---- runtime stage ----
# Unprivileged nginx (non-root, listens on 8080 — see nginx.conf).
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
