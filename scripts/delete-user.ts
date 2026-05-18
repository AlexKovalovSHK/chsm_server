import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deleteUserId = parseInt(process.argv[2], 10);
  const keepUserId = process.argv[3] ? parseInt(process.argv[3], 10) : null;

  if (!deleteUserId) {
    console.error(
      'Usage: npx tsx scripts/delete-user.ts <user-id-to-delete> [keep-user-id]',
    );
    console.error(
      '  <user-id-to-delete>  — ID (integer) of the user to remove',
    );
    console.error(
      '  [keep-user-id]       — optional: if the "good" user exists, update Google/TG links',
    );
    process.exit(1);
  }

  // 1. Find the user
  const user = await prisma.user.findUnique({
    where: { id: deleteUserId },
    include: { studentProfiles: true },
  });

  if (!user) {
    console.error('❌ User not found');
    process.exit(1);
  }

  console.log(`\n🚨 User to DELETE:`);
  console.log(`  ID:        ${user.id}`);
  console.log(`  email:     ${user.email}`);
  console.log(`  name:      ${user.firstName} ${user.lastName}`);
  console.log(`  role:      ${user.role}`);
  console.log(
    `  Student:   ${user.studentProfiles.length > 0 ? `YES (id=${user.studentProfiles.map((p) => p.id).join(', ')})` : 'NO'}`,
  );

  if (keepUserId) {
    const keepUser = await prisma.user.findUnique({
      where: { id: keepUserId },
    });
    if (!keepUser) {
      console.error(`❌ Keep-user (ID=${keepUserId}) not found`);
      process.exit(1);
    }
    console.log(
      `\n✅ Keeping user ID=${keepUserId} (${keepUser.firstName} ${keepUser.lastName})`,
    );
  }

  console.log('\n⚠️  This action is irreversible!');
  console.log('Press Ctrl+C to cancel, or wait 5s to proceed...');
  await new Promise((r) => setTimeout(r, 5000));

  // 2. Delete student profile first (to break FK constraint)
  if (user.studentProfiles.length > 0) {
    for (const studentProfile of user.studentProfiles) {
      console.log(
        `\n🗑️  Deleting student profile (id=${studentProfile.id})...`,
      );

      // Delete all enrollments of this student (cascades to practices, grades, etc.)
      await prisma.enrollment.deleteMany({
        where: { studentId: studentProfile.id },
      });
      console.log('  ✅ Enrollments deleted');

      // Delete the student record
      await prisma.student.delete({ where: { id: studentProfile.id } });
      console.log('  ✅ Student profile deleted');
    }
  }

  // 3. Delete GoogleAuth records if any
  if (user.email) {
    await prisma.googleAuth.deleteMany({ where: { email: user.email } });
    console.log('  ✅ GoogleAuth records deleted');
  }

  // 4. If a keep-user was specified, transfer any remaining references
  if (keepUserId) {
    const keepUser = await prisma.user.findUnique({
      where: { id: keepUserId },
    });
    if (!keepUser) {
      console.error(`❌ Keep-user (ID=${keepUserId}) not found`);
      process.exit(1);
    }
    console.log(
      `\n🔗 Transferring Telegram mapping to user ID=${keepUserId}...`,
    );

    // If the deleting user has tgId and keep-user doesn't, transfer it
    if (user.tgId && keepUser.tgId !== user.tgId) {
      await prisma.user.update({
        where: { id: keepUserId },
        data: { tgId: user.tgId },
      });
      console.log(`  ✅ tgId transferred: ${user.tgId}`);
    }
  }

  // 5. Delete the user
  try {
    await prisma.user.delete({ where: { id: deleteUserId } });
    console.log(`\n✅ User ID=${deleteUserId} successfully deleted!`);
  } catch (err: any) {
    console.error(`\n❌ Failed to delete user: ${err.message}`);
    console.error(
      'Check if there are other related records. Run find-duplicate-users.ts first.',
    );
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
