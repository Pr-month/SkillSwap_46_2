import { FindManyOptions, ILike, Repository } from 'typeorm';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';

describe('CitiesService', () => {
  let service: CitiesService;
  let cityRepository: jest.Mocked<Pick<Repository<City>, 'find'>>;

  beforeEach(() => {
    cityRepository = {
      find: jest.fn(),
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
});
