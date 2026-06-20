FROM node:20-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/frontend/package.json apps/frontend/package.json

RUN pnpm install --filter frontend... --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_LIFTBOOK_API_URL=/api
ENV NEXT_PUBLIC_LIFTBOOK_API_URL=$NEXT_PUBLIC_LIFTBOOK_API_URL
ENV NODE_ENV=production

RUN pnpm --filter frontend build

WORKDIR /app/apps/frontend

CMD ["pnpm", "start", "--hostname", "0.0.0.0", "--port", "3000"]
