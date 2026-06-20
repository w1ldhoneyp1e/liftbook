FROM node:20-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/package.json

RUN pnpm install --filter backend... --frozen-lockfile

COPY . .

WORKDIR /app/apps/backend

CMD ["pnpm", "start"]
