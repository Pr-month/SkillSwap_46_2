import { AppDataSource } from "src/config/db.config";
import { User } from "src/users/entities/user.entity";
import { seedUserData } from './data/seed-user.data';
import * as bcrypt from 'bcrypt';

async function seedUser() {
    await AppDataSource.initialize();
    AppDataSource.setOptions({ synchronize: true });

    const userRepo = AppDataSource.getRepository(User);

    const userCount = await userRepo.count();

    if (userCount > 0) {
        console.log("Users already exists");
        return;
    }

    for (const userData of seedUserData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = userRepo.create({
            ...userData,
            password: hashedPassword,
        });
        await userRepo.save(user);
    }

    console.log(`Seeded ${seedUserData.length} users`);
}

seedUser()
    .catch((error) => {
        console.error("Error seeding users data: ", error);
    })
    .finally(() => {
        if (AppDataSource.isInitialized) {
            AppDataSource.destroy();
        }
    });