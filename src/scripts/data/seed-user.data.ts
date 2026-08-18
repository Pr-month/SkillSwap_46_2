import { Role } from '../../shared/enums/role.enum';
import { Gender } from '../../shared/enums/gender.enum';
import { City } from '../../cities/entities/city.entity';

const createCity = (id: string, name: string, region: string): City => {
  const city = new City();
  city.id = id;
  city.name = name;
  city.region = region;
  return city;
};

export const seedUserData = [
  {
    id: 'a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c',
    email: 'anna.petrova@example.com',
    password: 'Password123!',
    name: 'Анна Петрова',
    about:
      'Изучаю английский и хочу подтянуть разговорную практику. Люблю рисование и готова делиться опытом с новичками.',
    birthdate: new Date('1998-04-12'),
    city: createCity('55b0ae5d-4970-43e8-9e06-b701406e48df', 'Город1', 'Регион1'),
    gender: Gender.FEMALE,
    avatar: 'https://i.pravatar.cc/300?img=12',
    role: Role.USER,
    refreshToken: null,
    wantToLearn: [],
    favoriteSkills: [],
  },
  {
    id: 'b2c3d4e5-f6a7-48b9-0c1d-2e3f4a5b6c7d',
    email: 'ivan.smirnov@example.com',
    password: 'SecurePass456!',
    name: 'Иван Смирнов',
    about:
      'Backend-разработчик, интересуюсь программированием и хочу научиться игре на гитаре.',
    birthdate: new Date('1995-11-23'),
    city: createCity('dea5c7bd-0060-4b3e-a83d-71772b902eaa', 'Город2', 'Регион2'),
    gender: Gender.MALE,
    avatar: 'https://i.pravatar.cc/300?img=10',
    role: Role.USER,
    refreshToken: null,
    wantToLearn: [],
    favoriteSkills: [],
  },
];
