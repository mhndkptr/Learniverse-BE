import { hashPassword } from "../utils/passwordConfig.js";
import { PrismaService } from "../common/services/prisma-service.js";
import Role from "../common/enums/role-enum.js";

class AdminSeeder {
  constructor() {
    this.prisma = new PrismaService();
  }

  async seed(name, username, phone_number, email, password) {
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    const exists = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (exists) {
      console.log(`Admin already exists: ${normalizedEmail}`);
      return;
    }

    const hashed = await hashPassword(password);

    const created = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name,
        username: normalizedUsername,
        phone_number: phone_number,
        password: hashed,
        role: Role.ADMIN,
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        updated_at: true,
      },
    });

    console.log("Admin seeded:", created);
  }
}

const seeder = new AdminSeeder();
seeder
  .seed(
    "Administrator",
    "administrator",
    "+62123123123",
    "admin@dev.com",
    "Administrator123!"
  )
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await seeder.prisma.$disconnect();
  });
