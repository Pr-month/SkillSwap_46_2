import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { FindSkillsDto } from './dto/find-skills.dto';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { RequestWithUser } from '../auth/auth.types';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  create(@Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto);
  }

  @Get()
  findAll(@Query() dto: FindSkillsDto) {
    return this.skillsService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(+id, updateSkillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillsService.remove(+id);
  }

  @Post(':id/favorite')
  @UseGuards(AccessTokenGuard)
  addFavorite(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.skillsService.addToFavorites(id, req.user.sub);
  }

  @Delete(':id/favorite')
  @UseGuards(AccessTokenGuard)
  removeFavorite(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.skillsService.removeFromFavorites(id, req.user.sub);
  }
}
