import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
  InternalServerErrorException
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './auth.types';
import { Role } from '../shared/enums/role.enum';
import { AuthResult } from './auth.types';

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
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

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
      select: ['id', 'email', 'password', 'role', 'refreshToken'],
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<AuthResult> {
    const { accessToken, refreshToken } = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role as Role,
    });

    (user as any).refreshToken = refreshToken;
    await this.userRepository.save(user as any);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    try {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const newUserData: Partial<User> = {
        email: dto.email,
        password: hashedPassword,
        city: dto.city,
        about: dto.about,
        role: Role.USER,
      };
      if (dto.birthdate) {
        newUserData.birthdate = new Date(dto.birthdate);
      }

      const newUser = this.userRepository.create(newUserData as any);
      const user = await this.userRepository.save(newUser as any);
      if (!user) {
        throw new UnauthorizedException('Не удалось создать пользователя');
      }

      const { accessToken, refreshToken } = this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as Role,
      });

      (user as any).refreshToken = refreshToken;
      await this.userRepository.save(user as any);

      return {
        user: {
          id: user.id,
          email: user.email,
          city: (user as any).city,
          about: (user as any).about,
          birthdate: (user as any).birthdate
            ? (user as any).birthdate.toISOString().split('T')[0]
            : null,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (err) {
      console.error('AuthService.register error:', (err as any)?.stack ?? err);
      throw new InternalServerErrorException('Ошибка регистрации');
    }
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      (user as any).refreshToken = null;
      await this.userRepository.save(user as any);
    }
  }

  async refreshFromPayload(userPayload: JwtPayload): Promise<AuthResult> {
    const user = await this.userRepository.findOne({
      where: { id: userPayload.sub },
      select: ['id', 'email', 'role', 'refreshToken'],
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const incomingRefreshToken = (userPayload as any).refreshToken;
    if (incomingRefreshToken && incomingRefreshToken !== (user as any).refreshToken) {
      throw new UnauthorizedException('Неверный refreshToken');
    }

    return this.issueTokens(user);
  }
}