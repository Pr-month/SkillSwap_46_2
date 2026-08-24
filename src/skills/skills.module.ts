import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { Skill } from './entities/skill.entity';
import { UsersModule } from '../users/users.module';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, Category]), UsersModule],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
