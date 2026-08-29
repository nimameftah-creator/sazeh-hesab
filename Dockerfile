# ═══════════════════════════════════════════════════════════
# دفتر ساختمان — ایمیج تولید
# ═══════════════════════════════════════════════════════════
# ساخت:    docker build -t daftar-sakhteman .
# اجرا:    docker run -p 4000:3000 --env-file .env daftar-sakhteman
# ═══════════════════════════════════════════════════════════

# ── مرحله ۱: نصب وابستگی‌ها ───────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# ── مرحله ۲: ساخت برنامه ──────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── مرحله ۳: ایمیج نهایی (کوچک و امن) ─────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# کاربر غیر root برای امنیت
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.json ./drizzle.config.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

USER nextjs
EXPOSE 3000

# بررسی سلامت — اگر برنامه بالا نیامد، ارکستریتر می‌فهمد
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["npm", "run", "start"]
