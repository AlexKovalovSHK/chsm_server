FROM oven/bun:latest

# Устанавливаем клиент Postgres
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN bun install

# Генерируем клиент Prisma
RUN bun x prisma generate

# Копируем весь исходный код
COPY . .

# Пропускаем RUN bun run build! 
# Bun сам скомпилирует TS в процессе работы.

EXPOSE 5008

# Запускаем напрямую через bun из папки src
CMD ["bun", "src/main.ts"]