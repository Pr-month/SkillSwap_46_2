import { AppDataSource } from '../config/db.config';
import { Category } from '../categories/entities/category.entity';
import { CategoriesData } from './data/seed-categories.data';

async function seedCategories() {
  await AppDataSource.initialize();

  const categoryRepository = AppDataSource.getRepository(Category);

  for (const categoryData of CategoriesData) {
    const existingCategory = await categoryRepository.findOne({
      where: { name: categoryData.name },
    });

    if (existingCategory) {
      continue;
    }

    const parentCategory = categoryRepository.create({
      name: categoryData.name,
      parent: null,
    });

    await categoryRepository.save(parentCategory);

    const children = categoryData.children.map((name) =>
      categoryRepository.create({
        name,
        parent: parentCategory,
      }),
    );

    await categoryRepository.save(children);
  }

  console.log('Categories seeded successfully');
}

seedCategories()
  .catch((error) => {
    console.error('Error seeding categories:', error);
  })
  .finally(() => {
    if (AppDataSource.isInitialized) {
      void AppDataSource.destroy();
    }
  });
