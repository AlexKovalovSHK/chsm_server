import { PrismaClient } from '@prisma/client';
import { $ } from 'bun';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

// Конфигурация из ENV
const SOURCE_DB = process.env.DATABASE_URL;
const TARGET_DB = process.env.DATABASE_BACKUP_URL;

// Настройки
const BACKUP_DIR = './backups_history'; // Папка для файлов
const RETENTION_DAYS = 14;              // Сколько дней хранить историю
const MIN_USERS = 5;                    // Минимум юзеров для проверки

export async function runSuperBackup() {
  if (!SOURCE_DB || !TARGET_DB) {
    console.error("❌ Ошибка: Не найдены ссылки на базы в .env");
    process.exit(1);
  }

  console.log("🚀 Запуск комплексного резервного копирования...");
  console.log("--------------------------------------------");

  // --- ШАГ 1: SANITY CHECK ---
  console.log("🕵️  Шаг 1: Проверка данных (Sanity Check)...");
  try {
    const usersCount = await prisma.user.count();
    console.log(`📊 Найдено пользователей в источнике: ${usersCount}`);

    if (usersCount < MIN_USERS) {
      console.error(`🚨 ТРЕВОГА! В базе подозрительно мало данных (${usersCount}).`);
      console.error("❌ Действие отменено, чтобы не испортить бэкапы пустой базой.");
      process.exit(1);
    }
    console.log("✅ Проверка пройдена.");
  } catch (err) {
    console.error("❌ Ошибка при попытке проверить базу данных:", err);
    process.exit(1);
  }

  // --- ШАГ 2: КЛОНИРОВАНИЕ (ЗЕРКАЛО) ---
  console.log("\n🔄 Шаг 2: Клонирование в резервную базу (Зеркало)...");
  try {
    // Копируем данные напрямую из одной базы в другую
    // --clean --if-exists удаляет старые таблицы в целевой базе перед заливкой
    await $`pg_dump --clean --if-exists ${SOURCE_DB} | psql ${TARGET_DB}`;
    console.log("✅ Зеркало успешно обновлено.");
  } catch (err) {
    console.error("❌ Ошибка при зеркалировании:", err);
    // Продолжаем выполнение, чтобы попытаться хотя бы сделать файл
  }

  // --- ШАГ 3: ВЕРСИОНИРОВАНИЕ (ФАЙЛ С ДАТОЙ) ---
  console.log("\n📦 Шаг 3: Создание архивного файла (Версионирование)...");
  try {
    if (!existsSync(BACKUP_DIR)) await mkdir(BACKUP_DIR);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `${BACKUP_DIR}/backup_${timestamp}.sql.gz`;

    await $`pg_dump ${SOURCE_DB} | gzip > ${fileName}`;
    console.log(`✅ Файл бэкапа создан: ${fileName}`);
  } catch (err) {
    console.error("❌ Ошибка при создании файла бэкапа:", err);
  }

  // --- ШАГ 4: РОТАЦИЯ (ОЧИСТКА СТАРЫХ ФАЙЛОВ) ---
  console.log(`\n🧹 Шаг 4: Удаление файлов старше ${RETENTION_DAYS} дней...`);
  try {
    await $`find ${BACKUP_DIR} -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete`;
    console.log("✅ Старые файлы удалены.");
  } catch (err) {
    console.warn("⚠️ Не удалось очистить старые файлы (возможно, папка пуста).");
  }

  console.log("--------------------------------------------");
  console.log("🏁 Все процессы завершены!");
  
  await prisma.$disconnect();
}

runSuperBackup();