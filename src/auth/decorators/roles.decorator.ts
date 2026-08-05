import { Reflector } from '@nestjs/core';
import { Role } from 'src/shared/enums/role.enum';

export const Roles = Reflector.createDecorator<Role[]>();
