import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../../shared/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude()
  @Column({ select: false, length: 255 })
  password: string;

  @Column('text', { nullable: true })
  about: string;

  @Column('date', { nullable: true })
  birthdate: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 30, nullable: true })
  gender: string;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ default: Role.USER })
  role: Role;

  @Exclude()
  @Column({ select: false, nullable: true, type: 'text' })
  refreshToken: string | null;
}
