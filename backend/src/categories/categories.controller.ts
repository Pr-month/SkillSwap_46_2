import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../shared/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCategoriesCreate,
  ApiCategoriesFindAll,
  ApiCategoriesFindOne,
  ApiCategoriesRemove,
  ApiCategoriesUpdate,
} from './categories.swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiCategoriesFindAll()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiCategoriesFindOne()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiCategoriesCreate()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiCategoriesUpdate()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCategoriesRemove()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.remove(id);
  }
}
