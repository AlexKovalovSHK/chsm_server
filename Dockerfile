FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 5008
CMD ["bun", "run", "start:prod"]