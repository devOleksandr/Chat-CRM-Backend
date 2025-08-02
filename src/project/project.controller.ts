import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '#db';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectFiltersDto,
} from './dto/project.dto';
import {
  ProjectResponseDto,
  ProjectListResponseDto,
} from './dto/project-response.dto';

/**
 * Controller for managing projects
 * Provides REST API endpoints for project CRUD operations
 */
@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * Create a new project
   */
  @Post()
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Creates a new project with the provided data. Only admins can create projects.',
  })
  @ApiBody({
    type: CreateProjectDto,
    description: 'Project creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid project data',
  })
  @ApiResponse({
    status: 409,
    description: 'Project with this unique ID already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    const userId = req.user.id;
    
    return this.projectService.createProject(
      {
        ...createProjectDto,
        userId,
      },
      userId,
    );
  }

  /**
   * Get project by ID
   */
  @Get(':id')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Get project by ID',
    description: 'Retrieves a project by its ID. Users can only access their own projects.',
  })
  @ApiParam({
    name: 'id',
    description: 'Project ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to this project',
  })
  async getProjectById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    const userId = req.user.id;
    return this.projectService.getProjectById(id, userId);
  }

  /**
   * Get project by unique ID
   */
  @Get('unique/:uniqueId')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Get project by unique ID',
    description: 'Retrieves a project by its unique ID. Users can only access their own projects.',
  })
  @ApiParam({
    name: 'uniqueId',
    description: 'Project unique ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to this project',
  })
  async getProjectByUniqueId(
    @Param('uniqueId') uniqueId: string,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    const userId = req.user.id;
    return this.projectService.getProjectByUniqueId(uniqueId, userId);
  }

  /**
   * Get all projects for the current user
   */
  @Get()
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Get user projects',
    description: 'Retrieves all projects for the authenticated user with optional filtering.',
  })
  @ApiQuery({
    name: 'name',
    description: 'Filter by project name (partial match)',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'uniqueId',
    description: 'Filter by project unique ID',
    required: false,
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
    type: ProjectListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getUserProjects(
    @Query() filters: ProjectFiltersDto,
    @Request() req: any,
  ): Promise<ProjectListResponseDto> {
    const userId = req.user.id;
    return this.projectService.getUserProjects(userId, filters);
  }

  /**
   * Update project
   */
  @Put(':id')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Update project',
    description: 'Updates an existing project. Users can only update their own projects.',
  })
  @ApiParam({
    name: 'id',
    description: 'Project ID',
    type: 'number',
  })
  @ApiBody({
    type: UpdateProjectDto,
    description: 'Project update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid project data',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Project with this unique ID already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to this project',
  })
  async updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    const userId = req.user.id;
    return this.projectService.updateProject(id, updateProjectDto, userId);
  }

  /**
   * Delete project
   */
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete project',
    description: 'Deletes a project. Users can only delete their own projects.',
  })
  @ApiParam({
    name: 'id',
    description: 'Project ID',
    type: 'number',
  })
  @ApiResponse({
    status: 204,
    description: 'Project deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to this project',
  })
  async deleteProject(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.id;
    await this.projectService.deleteProject(id, userId);
  }

  /**
   * Check if unique ID is available
   */
  @Get('check-availability/:uniqueId')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Check unique ID availability',
    description: 'Checks if a project unique ID is available for use.',
  })
  @ApiParam({
    name: 'uniqueId',
    description: 'Unique ID to check',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability check completed',
    schema: {
      type: 'object',
      properties: {
        available: {
          type: 'boolean',
          description: 'Whether the unique ID is available',
        },
        uniqueId: {
          type: 'string',
          description: 'The unique ID that was checked',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid unique ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async checkUniqueIdAvailability(
    @Param('uniqueId') uniqueId: string,
  ): Promise<{ available: boolean; uniqueId: string }> {
    const available = await this.projectService.isUniqueIdAvailable(uniqueId);
    return { available, uniqueId };
  }
} 