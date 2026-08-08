import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 250 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { array: true, default: [] })
  images: string[];

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // TODO: добавить связь с Categories, когда появится ресурс categories
}
