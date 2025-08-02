import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Request,
  UseGuards,
  UseFilters,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '#db';
import { PaginateUserDto, AdminUpdateUserDto } from './index';
import { UserExceptionFilter } from './filters/user-exception.filter';
import { ConfirmPasswordChangeDto } from './dto/confirm-password-change.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseFilters(UserExceptionFilter)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get all users (paginated, admin only)' })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserResponseDto] })
  async getAllUsers(@Query() query: PaginateUserDto) {
    return this.userService.getAllUsers(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get user by id (admin only)' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: number) {
    return this.userService.findUserById(Number(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update user by id (admin only)' })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserByAdmin(
    @Param('id') id: number,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.userService.updateUserByAdmin(Number(id), dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete user by id with cascade deletion (admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: number) {
    await this.userService.deleteUser(Number(id));
    return { message: 'User deleted successfully' };
  }



  @Post('confirm-password-change')
  @ApiOperation({ summary: 'Confirm password change with token from email' })
  @ApiBody({ type: ConfirmPasswordChangeDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirmPasswordChange(@Body() dto: ConfirmPasswordChangeDto) {
    return this.userService.confirmPasswordChange(dto);
  }
}
