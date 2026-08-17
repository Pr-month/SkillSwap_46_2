import { Exclude } from 'class-transformer';
import {
  Column,
  Entity, JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../shared/enums/role.enum';
import { Gender } from '../../shared/enums/gender.enum';
import { Category } from '../../categories/entities/category.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { City } from "../../cities/entities/city.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude()
  @Column({ select: false, length: 255 })
  password: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  about: string;

  @Column('date', { nullable: true })
  birthdate: Date;

  @ManyToOne(() => City, (city) => city.users, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'city_id' })
  city: City | null

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Exclude()
  @Column({ select: false, nullable: true, type: 'text' })
  refreshToken: string | null;

  @ManyToMany(() => Category, (category) => category.wantToLearnUsers)
  @JoinTable({ name: 'users_want_to_learn' })
  wantToLearn: Category[];

  @ManyToMany(() => Skill)
  @JoinTable({
    name: 'user_favorite_skills',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  favoriteSkills: Skill[];
}
