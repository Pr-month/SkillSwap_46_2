import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
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

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  synchronize: false,
});

async function seedAdmin() {
  await dataSource.initialize();
  const userRepository = dataSource.getRepository(User);

  const existing = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`Администратор с email "${adminEmail}" уже существует`);
    await dataSource.destroy();
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

  await dataSource.destroy();
}

seedAdmin().catch((error) => {
  console.error('Ошибка при создании администратора:', error);
  process.exit(1);
});