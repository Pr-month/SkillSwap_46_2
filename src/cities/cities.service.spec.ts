import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';

type CityRepositoryMock = jest.Mocked<
  Pick<Repository<City>, 'find' | 'findOne' | 'create' | 'save' | 'delete'>
>;

describe('CitiesService', () => {
  let service: CitiesService;
  let cityRepository: CityRepositoryMock;

  const city = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Иркутск',
    region: 'Иркутская область',
    users: [],
  } as unknown as City;

  beforeEach(() => {
    cityRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    service = new CitiesService(cityRepository as unknown as Repository<City>);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('returns cities without search filter when search is not provided', async () => {
      const cities = [
        {
          id: 'city-1',
          name: 'Москва',
          region: 'Москва',
        },
      ] as City[];

      cityRepository.find.mockResolvedValue(cities);

      await expect(service.search()).resolves.toEqual(cities);

      expect(cityRepository.find).toHaveBeenCalledWith({
        select: ['id', 'name', 'region'],
        where: {},
        order: { name: 'ASC' },
        take: 10,
      });
    });

    it('filters cities by name using case-insensitive partial search', async () => {
      cityRepository.find.mockResolvedValue([]);

      await service.search('моск');

      const options = cityRepository.find.mock
        .calls[0][0] as FindManyOptions<City>;

      expect(options).toEqual({
        select: ['id', 'name', 'region'],
        where: {
          name: ILike('%моск%'),
        },
        order: { name: 'ASC' },
        take: 10,
      });
    });

    it('returns repository result unchanged', async () => {
      const cities = [
        {
          id: 'city-1',
          name: 'Иркутск',
          region: 'Иркутская область',
        },
        {
          id: 'city-2',
          name: 'Ирбит',
          region: 'Свердловская область',
        },
      ] as City[];

      cityRepository.find.mockResolvedValue(cities);

      await expect(service.search('ир')).resolves.toEqual(cities);
    });
  });

  describe('create', () => {
    it('creates a city when duplicate does not exist', async () => {
      const dto = {
        name: 'Ангарск',
        region: 'Иркутская область',
      };
      const createdCity = {
        ...city,
        id: '22222222-2222-4222-8222-222222222222',
        ...dto,
      };

      cityRepository.findOne.mockResolvedValue(null);
      cityRepository.create.mockReturnValue(createdCity);
      cityRepository.save.mockResolvedValue(createdCity);

      await expect(service.create(dto)).resolves.toEqual(createdCity);

      expect(cityRepository.findOne).toHaveBeenCalledWith({
        where: dto,
      });
      expect(cityRepository.create).toHaveBeenCalledWith(dto);
      expect(cityRepository.save).toHaveBeenCalledWith(createdCity);
    });

    it('throws ConflictException when city already exists', async () => {
      const dto = {
        name: city.name,
        region: city.region,
      };

      cityRepository.findOne.mockResolvedValue(city);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);

      expect(cityRepository.create).not.toHaveBeenCalled();
      expect(cityRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates city when new name and region are unique', async () => {
      const dto = {
        name: 'Байкальск',
        region: 'Иркутская область',
      };
      const updatedCity = {
        ...city,
        ...dto,
      };

      cityRepository.findOne
        .mockResolvedValueOnce({ ...city })
        .mockResolvedValueOnce(null);
      cityRepository.save.mockResolvedValue(updatedCity);

      await expect(service.update(city.id, dto)).resolves.toEqual(updatedCity);

      expect(cityRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: city.id },
      });
      expect(cityRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: dto,
      });
      expect(cityRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(dto),
      );
    });

    it('updates city without duplicate lookup when values are unchanged', async () => {
      const existingCity = { ...city };

      cityRepository.findOne.mockResolvedValue(existingCity);
      cityRepository.save.mockResolvedValue(existingCity);

      await expect(
        service.update(city.id, { name: city.name }),
      ).resolves.toEqual(existingCity);

      expect(cityRepository.findOne).toHaveBeenCalledTimes(1);
      expect(cityRepository.save).toHaveBeenCalledWith(existingCity);
    });

    it('throws NotFoundException when city does not exist', async () => {
      cityRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(city.id, { name: 'Новый город' }),
      ).rejects.toThrow(NotFoundException);

      expect(cityRepository.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when updated city already exists', async () => {
      const duplicate = {
        ...city,
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Ангарск',
      };

      cityRepository.findOne
        .mockResolvedValueOnce({ ...city })
        .mockResolvedValueOnce(duplicate);

      await expect(
        service.update(city.id, { name: duplicate.name }),
      ).rejects.toThrow(ConflictException);

      expect(cityRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes city without linked users', async () => {
      cityRepository.findOne.mockResolvedValue(city);
      cityRepository.delete.mockResolvedValue({
        raw: [],
        affected: 1,
      });

      await expect(service.remove(city.id)).resolves.toBeUndefined();

      expect(cityRepository.findOne).toHaveBeenCalledWith({
        where: { id: city.id },
        relations: { users: true },
      });
      expect(cityRepository.delete).toHaveBeenCalledWith(city.id);
    });

    it('throws NotFoundException when city does not exist', async () => {
      cityRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(city.id)).rejects.toThrow(NotFoundException);

      expect(cityRepository.delete).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when city has linked users', async () => {
      const cityWithUsers = {
        ...city,
        users: [{ id: 'user-1' }],
      } as unknown as City;

      cityRepository.findOne.mockResolvedValue(cityWithUsers);

      await expect(service.remove(city.id)).rejects.toThrow(
        BadRequestException,
      );

      expect(cityRepository.delete).not.toHaveBeenCalled();
    });
  });
});
