import { AppDataSource } from '../config/db.config';
import { City } from '../cities/entities/city.entity';
import { seedCitiesData } from './data/seed-cities.data';

const getCityKey = (name: string, region: string) => `${name}|||${region}`;

async function seedCities() {
  await AppDataSource.initialize();

  const cityRepository = AppDataSource.getRepository(City);

  const existingCities = await cityRepository.find({
    select: ['name', 'region'],
  });

  const existingCityKeys = new Set(
    existingCities.map((city) => getCityKey(city.name, city.region)),
  );

  const citiesToCreate = seedCitiesData
    .filter(
      (cityData) =>
        !existingCityKeys.has(getCityKey(cityData.name, cityData.region)),
    )
    .map((cityData) => cityRepository.create(cityData));

  if (citiesToCreate.length > 0) {
    await cityRepository.save(citiesToCreate);
  }

  console.log(
    `Seeded ${citiesToCreate.length} cities (${seedCitiesData.length} cities in dataset)`,
  );
}

seedCities()
  .catch((error) => {
    console.error('Error seeding cities:', error);
  })
  .finally(() => {
    if (AppDataSource.isInitialized) {
      void AppDataSource.destroy();
    }
  });
