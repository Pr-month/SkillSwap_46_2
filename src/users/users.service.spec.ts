import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Gender } from '../shared/enums/gender.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

jest.mock('bcrypt');

const bcryptCompare = bcrypt.compare as jest.MockedFunction<
  (data: string, encrypted: string) => Promise<boolean>
>;

const bcryptHash = bcrypt.hash as jest.MockedFunction<
  (data: string, saltOrRounds: number) => Promise<string>
>;

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<
    Pick<
      Repository<User>,
      'findAndCount' | 'findOne' | 'update' | 'merge' | 'save'
    >
  >;

  const existingUser = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'hashed-old-password',
    refreshToken: null,
  } as User;

  const updateUserDto: UpdateUserDto = {
    email: 'updated@example.com',
    name: 'Новое имя',
    about: 'Обновлённая информация',
    birthdate: new Date('1990-01-01'),
    gender: Gender.MALE,
    avatar: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    userRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      merge: jest.fn(),
      save: jest.fn(),
    };

    service = new UsersService(userRepository as unknown as Repository<User>);

    bcryptCompare.mockReset();
    bcryptHash.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

  describe('changePassword', () => {
    it('throws when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('missing-user', {
          oldPassword: 'old-password',
          newPassword: 'new-password',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(bcryptCompare).not.toHaveBeenCalled();
      expect(bcryptHash).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('rejects a new password equal to the current password input', async () => {
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(
        service.changePassword(existingUser.id, {
          oldPassword: 'same-password',
          newPassword: 'same-password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(bcryptCompare).not.toHaveBeenCalled();
      expect(bcryptHash).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('throws when current password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(existingUser);
      bcryptCompare.mockResolvedValue(false);

      await expect(
        service.changePassword(existingUser.id, {
          oldPassword: 'wrong-password',
          newPassword: 'new-password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(bcryptCompare).toHaveBeenCalledWith(
        'wrong-password',
        existingUser.password,
      );
      expect(bcryptHash).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('hashes and saves a valid new password', async () => {
      userRepository.findOne.mockResolvedValue(existingUser);
      bcryptCompare.mockResolvedValue(true);
      bcryptHash.mockResolvedValue('hashed-new-password');

      await expect(
        service.changePassword(existingUser.id, {
          oldPassword: 'old-password',
          newPassword: 'new-password',
        }),
      ).resolves.toEqual({
        message: 'Пароль успешно изменён',
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        select: ['id', 'password'],
      });
      expect(bcryptCompare).toHaveBeenCalledWith(
        'old-password',
        existingUser.password,
      );
      expect(bcryptHash).toHaveBeenCalledWith('new-password', 10);
      expect(userRepository.update).toHaveBeenCalledWith(existingUser.id, {
        password: 'hashed-new-password',
      });
    });
  });

  describe('update', () => {
    it('throws when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-user', updateUserDto),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(userRepository.merge).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('merges, saves and returns updated user', async () => {
      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.merge.mockReturnValue(existingUser);
      userRepository.save.mockResolvedValue(existingUser);

      await expect(
        service.update(existingUser.id, updateUserDto),
      ).resolves.toBe(existingUser);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: existingUser.id },
      });
      expect(userRepository.merge).toHaveBeenCalledWith(
        existingUser,
        updateUserDto,
      );
      expect(userRepository.save).toHaveBeenCalledWith(existingUser);
    });
  });

  describe('lookup helpers', () => {
    it('findById loads the city relation', async () => {
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.findById(existingUser.id)).resolves.toBe(
        existingUser,
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        relations: { city: true },
      });
    });

    it('findByEmailWithPassword selects authentication fields', async () => {
      userRepository.findOne.mockResolvedValue(existingUser);

      await service.findByEmailWithPassword(existingUser.email);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: existingUser.email },
        select: ['id', 'email', 'password', 'role'],
      });
    });

    it('findByIdWithRefreshToken selects refresh token fields', async () => {
      userRepository.findOne.mockResolvedValue(existingUser);

      await service.findByIdWithRefreshToken(existingUser.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        select: ['id', 'email', 'role', 'refreshToken'],
      });
    });

    it('findByIdWithFavorites loads favorite skills relation', async () => {
      userRepository.findOne.mockResolvedValue(existingUser);

      await service.findByIdWithFavorites(existingUser.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        relations: { favoriteSkills: true },
      });
    });
  });

  describe('refresh token', () => {
    it('updates refresh token', async () => {
      await service.updateRefreshToken(existingUser.id, 'refresh-token');

      expect(userRepository.update).toHaveBeenCalledWith(existingUser.id, {
        refreshToken: 'refresh-token',
      });
    });

    it('clears refresh token', async () => {
      await service.clearRefreshToken(existingUser.id);

      expect(userRepository.update).toHaveBeenCalledWith(existingUser.id, {
        refreshToken: null,
      });
    });
  });

  describe('favorites', () => {
    it('saves user favorites', async () => {
      userRepository.save.mockResolvedValue(existingUser);

      await service.saveFavorites(existingUser);

      expect(userRepository.save).toHaveBeenCalledWith(existingUser);
    });
  });
});
