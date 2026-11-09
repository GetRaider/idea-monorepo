FROM node:22-bookworm

RUN corepack enable \
  && corepack prepare pnpm@10.9.0 --activate \
  && apt-get update \
  && apt-get install -y --no-install-recommends wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY . .

RUN pnpm install --frozen-lockfile --filter evolin-api... \
  && pnpm --filter @repo/evolin-shared build

EXPOSE 8092

CMD ["sh", "-c", "pnpm --filter @repo/evolin-shared dev & pnpm --filter evolin-api dev"]
