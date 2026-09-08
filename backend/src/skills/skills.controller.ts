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
import { Request } from 'express';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { FindSkillsDto } from './dto/find-skills.dto';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { RequestWithUser } from '../auth/auth.types';
import { JwtPayload } from 'src/auth/auth.types';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiSkillsAddFavorite,
  ApiSkillsCreate,
  ApiSkillsFindAll,
  ApiSkillsFindOne,
  ApiSkillsRemove,
  ApiSkillsRemoveFavorite,
  ApiSkillsUpdate,
} from './skills.swagger';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @ApiSkillsCreate()
  create(@Req() req: Request, @Body() createSkillDto: CreateSkillDto) {
    const user = req.user as JwtPayload;
    return this.skillsService.create(user.sub, createSkillDto);
  }

  @Get()
  @ApiSkillsFindAll()
  findAll(@Query() dto: FindSkillsDto) {
    return this.skillsService.findAll(dto);
  }

  @Get(':id/similar')
  findSimilarUsers(@Param('id') id: string) {
    return this.skillsService.findSimilarUsers(id);
  }

  @Get(':id')
  @ApiSkillsFindOne()
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @ApiSkillsUpdate()
  @UseGuards(AccessTokenGuard)
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
  ) {
    const user = req.user as JwtPayload;
    return this.skillsService.update(user.sub, id, updateSkillDto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  @ApiSkillsRemove()
  remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;

    return this.skillsService.remove(user.sub, id);
  }

  @Post(':id/favorite')
  @UseGuards(AccessTokenGuard)
  @ApiSkillsAddFavorite()
  addFavorite(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.skillsService.addToFavorites(id, req.user.sub);
  }

  @Delete(':id/favorite')
  @UseGuards(AccessTokenGuard)
  @ApiSkillsRemoveFavorite()
  removeFavorite(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.skillsService.removeFromFavorites(id, req.user.sub);
  }
}
