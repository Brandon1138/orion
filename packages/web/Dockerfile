FROM node:20-bullseye-slim

WORKDIR /app

# Install better-sqlite3 build deps
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY ../../package*.json ../../tsconfig.json /app/
COPY ../.. /app

RUN npm ci --workspaces --include-workspace-root
RUN npm run build -w @orion/web

ENV NODE_ENV=production
ENV ORION_DB_PATH=/app/data/orion.db
EXPOSE 3000

CMD ["npm", "run", "start", "-w", "@orion/web"]



