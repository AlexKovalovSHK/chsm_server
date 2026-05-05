FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock* ./
COPY prisma ./prisma/
RUN bun install
RUN bun x prisma generate
COPY . .
RUN bun run build
EXPOSE 5008
CMD ["bun", "dist/main.js"]