import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';
import { FindUsersDto } from './dto/find-users.dto';
import { City } from '../cities/entities/city.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  async findAll(dto: FindUsersDto) {
    const { page, limit } = dto;

    const [data, total] = await this.userRepository.findAndCount({
      select: {
        id: true,
        name: true,
        about: true,
        birthdate: true,
        gender: true,
        avatar: true,
        role: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    if (totalPages > 0 && page > totalPages) {
      throw new NotFoundException(`Запрашиваемая страница ${page} не найдена.`);
    }

    return {
      data,
      page,
      totalPages,
    };
  }

  async changePassword(
    id: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с id ${id} не найден`);
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        'Новый пароль должен отличаться от текущего',
      );
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new BadRequestException('Неверный текущий пароль');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(id, { password: hashedPassword });

    return { message: 'Пароль успешно изменён' };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { city: true },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с id ${id} не найден`);
    }

    const { cityId, ...rest } = dto;

    if (cityId !== undefined) {
      if (cityId === null) {
        user.city = null;
      } else {
        const city = await this.cityRepository.findOne({
          where: { id: cityId },
        });
        if (!city) {
          throw new BadRequestException(`Город с id ${cityId} не найден`);
        }
        user.city = city;
      }
    }

    this.userRepository.merge(user, rest);
    await this.userRepository.save(user);

    return user;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { city: true },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role'],
    });
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'role', 'refreshToken'],
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshToken });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: null });
  }

  async findByIdWithFavorites(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { favoriteSkills: true },
    });
  }

  async saveFavorites(user: User): Promise<void> {
    await this.userRepository.save(user);
  }
}
