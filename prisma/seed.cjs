const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 12) throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD (minimum 12 characters) in the deployment environment.');
  const hash = await bcrypt.hash(password, 12);
  await prisma.admin.upsert({ where: { username }, update: { password: hash }, create: { username, password: hash } });
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
