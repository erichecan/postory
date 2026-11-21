FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN npm install --no-audit --no-fund

FROM deps AS build
WORKDIR /app
# Used only at build time to bake TrueType glyphs into vector path data.
RUN apt-get update && apt-get install -y --no-install-recommends python3-fonttools fonts-liberation fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
COPY . .
RUN mkdir -p public && /usr/bin/python3 scripts/generate-sakura-glyphs.py && npx prisma generate && npm run build

FROM deps AS migrations
WORKDIR /app
COPY . .
RUN npx prisma generate
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM node:22-slim
# Sharp/librsvg renders Sakura campaign SVG headlines inside the container.
# node:22-slim has no usable font fallback by default (works on macOS only).
RUN apt-get update \
    && apt-get install -y --no-install-recommends fontconfig fonts-liberation fonts-dejavu-core fonts-noto-cjk \
    && fc-cache -f \
    && test -n "$(fc-match -f '%{family}' Arial)" \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 8080
CMD ["node", "server.js"]
