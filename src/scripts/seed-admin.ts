import { AppDataSource } from '../config/db.config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../shared/enums/role.enum';

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error(
    'Переменные ADMIN_EMAIL и ADMIN_PASSWORD должны быть заданы в .env',
  );
  process.exit(1);
}

async function seedAdmin() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);

  const existing = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`Администратор с email "${adminEmail}" уже существует`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword as string, 10);

  const admin = userRepository.create({
    email: adminEmail as string,
    password: hashedPassword,
    name: 'Admin',
    role: Role.ADMIN,
  });

  await userRepository.save(admin);
  console.log(`Администратор "${adminEmail}" успешно создан`);
}

seedAdmin()
  .catch((error) => {
    console.error('Ошибка при создании администратора:', error);
  })
  .finally(() => {
    if (AppDataSource.isInitialized) {
      AppDataSource.destroy();
    }
  });
