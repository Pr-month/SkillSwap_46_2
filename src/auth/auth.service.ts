import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResult, JwtPayload, RequestWithRefreshToken } from './auth.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { City } from '../cities/entities/city.entity';
import * as bcrypt from 'bcrypt';
import { Role } from '../shared/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  private generateTokens(user: { id: string; email: string; role: Role }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.accessSecret,
      expiresIn: this.jwtConfiguration.accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.refreshSecret,
      expiresIn: this.jwtConfiguration.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: ['id', 'email', 'password', 'role', 'refreshToken', 'name'],
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<AuthResult> {
    const { accessToken, refreshToken } = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    user.refreshToken = refreshToken;
    await this.userRepository.save(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      let city: City | null = null;
      if (dto.cityId) {
        city = await this.cityRepository.findOne({
          where: { id: dto.cityId },
        });
        if (!city) {
          throw new BadRequestException('Город с таким id не найден');
        }
      }

      const birthdate = dto.birthdate ? new Date(dto.birthdate) : undefined;
      const newUserData: Partial<User> = {
        email: dto.email,
        password: hashedPassword,
        city,
        about: dto.about,
        name: dto.name,
        birthdate,
        role: Role.USER,
      };
      const newUser = this.userRepository.create(newUserData);
      const user = await this.userRepository.save(newUser);
      if (!user) {
        throw new UnauthorizedException('Не удалось создать пользователя');
      }
      const { accessToken, refreshToken } = this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      user.refreshToken = refreshToken;
      await this.userRepository.save(user);
      return {
        user: {
          id: user.id,
          email: user.email,
          city: user.city
            ? {
                id: user.city.id,
                name: user.city.name,
                region: user.city.region,
              }
            : null,
          about: user.about,
          birthdate: user.birthdate
            ? user.birthdate.toISOString().split('T')[0]
            : null,
          role: user.role,
          name: user.name,
        },
        accessToken,
        refreshToken,
      };
    } catch (err: unknown) {
      if (err instanceof QueryFailedError) {
        const dbError = err as unknown as { code?: string; errno?: number };
        const code = dbError.code;
        if (code === '23505' || code === 'ER_DUP_ENTRY') {
          throw new ConflictException(
            'Пользователь с таким email уже существует',
          );
        }
      }
      if (err instanceof BadRequestException) {
        throw err;
      }
      console.error(
        'AuthService.register error:',
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('Ошибка регистрации');
    }
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.refreshToken = null;
      await this.userRepository.save(user);
    }
  }

  async refreshFromPayload(
    userPayload: RequestWithRefreshToken,
  ): Promise<AuthResult> {
    const user = await this.userRepository.findOne({
      where: { id: userPayload.user.sub },
      select: ['id', 'email', 'role', 'refreshToken'],
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (userPayload.user.refreshToken !== user.refreshToken) {
      throw new UnauthorizedException('Неверный refreshToken');
    }

    return this.issueTokens(user);
  }
}
