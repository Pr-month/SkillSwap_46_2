import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { City } from '../cities/entities/city.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<
    Pick<Repository<User>, 'findAndCount' | 'findOne' | 'merge' | 'save'>
  >;
  let cityRepository: jest.Mocked<Pick<Repository<City>, 'findOne'>>;

  beforeEach(() => {
    userRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      save: jest.fn(),
    };
    cityRepository = {
      findOne: jest.fn(),
    };

    service = new UsersService(
      userRepository as unknown as Repository<User>,
      cityRepository as unknown as Repository<City>,
    );
  });

  describe('findAll', () => {
    it('returns the first page with default pagination', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);

      await expect(service.findAll({ page: 1, limit: 20 })).resolves.toEqual({
        data: [],
        page: 1,
        totalPages: 0,
      });

      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
      });
    });

    it('calculates offset and total pages', async () => {
      const users = [{ id: 'user-1' }] as User[];
      userRepository.findAndCount.mockResolvedValue([users, 25]);

      await expect(service.findAll({ page: 2, limit: 10 })).resolves.toEqual({
        data: users,
        page: 2,
        totalPages: 3,
      });

      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
      });
    });

    it('throws when requested page does not exist', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 25]);

      await expect(
        service.findAll({ page: 4, limit: 10 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    const userId = 'user-1';
    const cityId = '000f75f7-caad-50e4-943a-a599c3fb4395';

    const makeUser = (): User =>
      ({ id: userId, name: 'Иван', city: null }) as unknown as User;

    it('throws NotFoundException when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, { name: 'Новое имя' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('assigns the city and merges the rest of the dto', async () => {
      const user = makeUser();
      const city = { id: cityId, name: 'Красноармейск' } as City;
      userRepository.findOne.mockResolvedValue(user);
      cityRepository.findOne.mockResolvedValue(city);
      userRepository.save.mockResolvedValue(user);

      await service.update(userId, { name: 'Новое имя', cityId });

      expect(cityRepository.findOne).toHaveBeenCalledWith({
        where: { id: cityId },
      });
      expect(user.city).toEqual(city);
      // merge получает остаток БЕЗ cityId
      expect(userRepository.merge).toHaveBeenCalledWith(user, {
        name: 'Новое имя',
      });
    });

    it('resets the city when cityId is null', async () => {
      const user = makeUser();
      user.city = { id: cityId } as City;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.update(userId, { cityId: null });

      expect(user.city).toBeNull();
      expect(cityRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the city does not exist', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValue(user);
      cityRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, { cityId }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('leaves the city untouched when cityId is not passed', async () => {
      const user = makeUser();
      const originalCity = { id: cityId } as City;
      user.city = originalCity;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.update(userId, { about: 'новый about' });

      expect(user.city).toBe(originalCity);
      expect(cityRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.merge).toHaveBeenCalledWith(user, {
        about: 'новый about',
      });
    });
  });
});