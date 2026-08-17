import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'findAndCount'>>;

  beforeEach(() => {
    userRepository = {
      findAndCount: jest.fn(),
    };

    service = new UsersService(userRepository as unknown as Repository<User>);
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
});
