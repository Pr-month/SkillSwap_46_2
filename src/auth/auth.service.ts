import {
  Injectable,
  ConflictException,
  UnauthorizedException,
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
import * as bcrypt from 'bcrypt';
import { Role } from '../shared/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

      const city = (dto as unknown as { city?: string }).city;
      const about = (dto as unknown as { about?: string }).about;
      const birthdate = dto.birthdate ? new Date(dto.birthdate) : undefined;

      const newUserData: Partial<User> = {
        email: dto.email,
        password: hashedPassword,
        city,
        about,
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
          city: user.city,
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
        const errno = dbError.errno;
        if (errno === 1062) {
          throw new ConflictException(
            'Пользователь с таким email уже существует',
          );
        }
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
