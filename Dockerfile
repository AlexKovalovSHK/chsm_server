FROM oven/bun:1.1 # Используем 1.1 или выше
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 5001
CMD ["bun", "run", "start:prod"]