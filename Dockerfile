FROM node:24-alpine AS build

# Stage 1 — Build the application
RUN apk add --no-cache git ca-certificates && update-ca-certificates
RUN npm install -g bun
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=8192

COPY package.json bun.lock ./
RUN bun install --ci

COPY . .
RUN bun x nuxi prepare
RUN bun x nuxi build

# Stage 2 — Run the application
FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PORT=8031
ENV NITRO_HOST=0.0.0.0

COPY --from=build /app/.output ./

EXPOSE 8031

CMD ["node", "server/index.mjs"]
