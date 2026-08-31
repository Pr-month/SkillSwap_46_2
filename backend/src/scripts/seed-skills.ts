import { AppDataSource } from '../config/db.config';
import { Category } from '../categories/entities/category.entity';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { seedSkillsData } from './data/seed-skills.data';

async function seedSkills() {
  await AppDataSource.initialize();

  const skillRepository = AppDataSource.getRepository(Skill);
  const userRepository = AppDataSource.getRepository(User);
  const categoryRepository = AppDataSource.getRepository(Category);

  for (const skillData of seedSkillsData) {
    const user = await userRepository.findOne({
      where: { id: skillData.ownerId },
    });

    if (!user) {
      throw new Error(`User with id "${skillData.ownerId}" not found`);
    }

    const category = await categoryRepository.findOne({
      where: { name: skillData.categoryName },
    });

    if (!category) {
      throw new Error(`Category "${skillData.categoryName}" not found`);
    }

    const existingSkill = await skillRepository.findOne({
      where: {
        title: skillData.title,
        user: { id: user.id },
      },
      relations: ['user'],
    });

    if (existingSkill) {
      continue;
    }

    const skill = skillRepository.create({
      title: skillData.title,
      description: skillData.description,
      images: skillData.images,
      user,
      category,
    });

    await skillRepository.save(skill);
  }

  console.log(`Seeded ${seedSkillsData.length} skills`);
}

seedSkills()
  .catch((error) => {
    console.error('Error seeding skills:', error);
  })
  .finally(() => {
    if (AppDataSource.isInitialized) {
      void AppDataSource.destroy();
    }
  });
