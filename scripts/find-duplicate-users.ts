import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'shk24alex@gmail.com';

  console.log(`\n🔍 Searching for users with email: ${email}\n`);

  const users = await prisma.user.findMany({
    where: { email },
    include: { studentProfiles: true },
  });

  if (users.length === 0) {
    console.log('❌ No users found with this email.');
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);

  for (const u of users) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ID:          ${u.id}`);
    console.log(`  email:       ${u.email}`);
    console.log(`  name:        ${u.firstName} ${u.lastName}`);
    console.log(`  role:        ${u.role}`);
    console.log(`  tgId:        ${u.tgId}`);
    console.log(`  googleId:    ${u.googleId}`);
    console.log(
      `  Student:     ${u.studentProfiles.length > 0 ? `YES (id=${u.studentProfiles.map((p) => p.id).join(', ')}, name=${u.studentProfiles.map((p) => p.name).join(', ')})` : 'NO'}`,
    );
    console.log('');
  }

  for (const u of users) {
    if (!u.mongoId) continue;
    const enrollments = await prisma.enrollment.count({
      where: { student: { userId: u.mongoId } },
    });
    console.log(
      `Enrollments for userId=${u.id} (mongoId=${u.mongoId}): ${enrollments}`,
    );
  }

  console.log('\n✅ Done.');
  console.log(
    '\nIf you want to delete one user, run the delete script with the user ID:',
  );
  console.log(
    '  npx tsx scripts/delete-user.ts <user-id-to-delete> <keep-user-id>',
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
