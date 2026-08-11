import { Role } from '../../shared/enums/role.enum';
import { Gender } from '../../shared/enums/gender.enum';

export const seedUserData = [
  {
    id: 'a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c',
    email: 'anna.petrova@example.com',
    password: 'Password123!',
    name: 'Анна Петрова',
    about: 'Изучаю английский и хочу подтянуть разговорную практику. Люблю рисование и готова делиться опытом с новичками.',
    birthdate: new Date('1998-04-12'),
    city: 'Москва',
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
    about: 'Backend-разработчик, интересуюсь программированием и хочу научиться игре на гитаре.',
    birthdate: new Date('1995-11-23'),
    city: 'Санкт-Петербург',
    gender: Gender.MALE,
    avatar: 'https://i.pravatar.cc/300?img=10',
    role: Role.USER,
    refreshToken: null,
    wantToLearn: [],
    favoriteSkills: [],
  },
];