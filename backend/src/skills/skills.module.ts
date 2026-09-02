import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { Skill } from './entities/skill.entity';
import { UsersModule } from '../users/users.module';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, Category, User]), UsersModule],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
