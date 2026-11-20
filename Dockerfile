# Build the bundled library and CLI.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# Minimal runtime: the CLI is dependency-free and imports the bundled library.
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3847

COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/bin/cli.mjs ./bin/cli.mjs
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 3847

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3847/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "bin/cli.mjs", "--serve"]
