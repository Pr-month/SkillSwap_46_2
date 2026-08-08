import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { Skill } from './entities/skill.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Skill]), UsersModule],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
