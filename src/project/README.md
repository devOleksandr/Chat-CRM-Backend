# Project Module

Project management module for Chat CRM system with comprehensive project operations, unique ID validation, and Clean Architecture implementation. Supports both admin project management and mobile app integration.

## Features

- ✅ Project creation and management (CRUD operations)
- ✅ Unique project ID validation and availability checking
- ✅ Role-based access control (Admin only for management)
- ✅ Support for mobile app integration
- ✅ Comprehensive error handling with Strategy Pattern
- ✅ Clean Architecture with dependency inversion
- ✅ JWT token-based authentication integration
- ✅ User ownership and access control
- ✅ Comprehensive logging and monitoring
- ✅ Cascade deletion for project removal
- ✅ Integration with chat and participant management

## Architecture Overview

The module follows **Clean Architecture** principles with **Dependency Inversion** and **Strategy Pattern**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ProjectController (REST API Endpoints)                     │
│  ├── POST /projects (admin only)                            │
│  ├── GET /projects (admin only)                             │
│  ├── GET /projects/:id (admin only)                         │
│  ├── GET /projects/unique/:uniqueId (admin only)            │
│  ├── PUT /projects/:id (admin only)                         │
│  ├── DELETE /projects/:id (admin only)                      │
│  └── GET /projects/check-availability/:uniqueId (public)    │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ProjectService (Business Logic)                            │
│  ├── Project CRUD operations                                │
│  ├── Admin ID retrieval for mobile app                      │
│  ├── Unique ID validation                                   │
│  └── Ownership verification                                 │
│  ProjectErrorHandler (Error Handling)                       │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ProjectExceptionFilter (HTTP Responses)                    │
│  Error Strategies (Specific Handling)                       │
│  ├── ProjectNotFoundStrategy                               │
│  ├── ProjectAlreadyExistsStrategy                          │
│  ├── InsufficientPermissionsStrategy                       │
│  └── GeneralProjectErrorStrategy                           │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ProjectRepositoryPort (Interface)                          │
│  ProjectRepository (Prisma ORM)                             │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (via Prisma)                           │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Admin Project Management (Requires JWT Authentication)

#### Create Project
```bash
POST /api/projects
Authorization: Bearer <jwt-token>
{
  "name": "My Project",
  "uniqueId": "project-123"
}
```

#### Get All Projects (Paginated)
```bash
GET /api/projects?limit=20&offset=0
Authorization: Bearer <jwt-token>
```

#### Get Project by ID
```bash
GET /api/projects/{id}
Authorization: Bearer <jwt-token>
```

#### Get Project by Unique ID
```bash
GET /api/projects/unique/{uniqueId}
Authorization: Bearer <jwt-token>
```

#### Update Project
```bash
PUT /api/projects/{id}
Authorization: Bearer <jwt-token>
{
  "name": "Updated Project Name",
  "uniqueId": "updated-project-123"
}
```

#### Delete Project
```bash
DELETE /api/projects/{id}
Authorization: Bearer <jwt-token>
```

### Public Endpoints

#### Check Unique ID Availability
```bash
GET /api/projects/check-availability/{uniqueId}
```

Response:
```json
{
  "available": true,
  "uniqueId": "project-123"
}
```

## Mobile App Integration

### Admin ID Retrieval
The Project module provides a method to retrieve the admin ID for a given project, which is essential for mobile app functionality:

```typescript
// Get the admin ID of a project
const adminId = await projectService.getProjectAdminId(projectId);
```

This method is used by the Chat module to:
- Create chats between admin and participants
- Validate mobile app access to projects
- Ensure proper authorization for chat operations

### Project Structure
Each project contains:
- **Admin** - The user who created the project (Admin role)
- **Participants** - Users who can participate in project chats (Participant role)
- **Chats** - Communication channels between admin and participants

## Error Handling Architecture

The module implements a **hybrid approach** combining NestJS Exception Filters with Strategy Pattern:

### Exception Filters (HTTP Layer)
- **Automatic HTTP status mapping** based on error codes
- **Consistent error response format** across all endpoints
- **Built-in NestJS integration**

### Strategy Pattern (Business Logic)
- **Logging and monitoring** for each error type
- **Security event detection** for potential threats
- **Metrics collection** for operational insights
- **Extensible error handling** with specific strategies

### Error Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Service       │───▶│ ErrorHandler     │───▶│ Error Strategy  │
│   (throws)      │    │   (business      │    │   (specific     │
│                  │    │    logic)        │    │    handling)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ ProjectException│
                       │ Filter (HTTP)   │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   HTTP Client   │
                       └─────────────────┘
```

## Integration with Other Modules

### Chat Module
- Projects serve as containers for chats
- Each chat is associated with a specific project
- Mobile app access is validated against project membership

### User Module
- Admin users can create and manage projects
- Project ownership is tracked for authorization
- Participants are associated with projects through ProjectParticipantService

### Auth Module
- JWT authentication required for admin operations
- Role-based access control (Admin/Participant)
- Project-based authorization for mobile app users

## Project Lifecycle

### 1. Project Creation
1. Admin creates project with unique ID
2. Project is associated with admin user
3. Project becomes available for participant management

### 2. Participant Management
1. Admin adds participants to project
2. Participants can be created via mobile app or admin interface
3. Each participant gets unique `participantId` for mobile access

### 3. Chat Creation
1. Chats are created between admin and participants
2. Mobile app can create chats using `projectId` and `participantId`
3. Admin can manage all chats in their projects

### 4. Project Deletion
1. Admin can delete project
2. Cascade deletion removes all related data:
   - Project participants
   - Chats and messages
   - Project associations

## Security Features

- **JWT authentication** for all admin operations
- **Project ownership verification** for updates and deletions
- **Unique ID validation** to prevent conflicts
- **Role-based access control** (Admin only for management)
- **Cascade deletion** for complete project removal
- **Audit logging** for project operations

## Usage Examples

### Basic Project Management
```typescript
// Create project
const project = await projectService.createProject({
  name: 'My Project',
  uniqueId: 'project-123'
}, adminUserId);

// Get project by ID
const project = await projectService.getProjectById(projectId, adminUserId);

// Update project
const updatedProject = await projectService.updateProject(projectId, {
  name: 'Updated Project Name'
}, adminUserId);

// Delete project
await projectService.deleteProject(projectId, adminUserId);
```

### Mobile App Integration
```typescript
// Get admin ID for mobile app chat creation
const adminId = await projectService.getProjectAdminId(projectId);

// Check unique ID availability
const availability = await projectService.checkUniqueIdAvailability('project-123');
```

## Error Types

### ProjectNotFoundError
- Thrown when project not found
- HTTP Status: `404 Not Found`

### ProjectAlreadyExistsError
- Thrown when project with unique ID already exists
- HTTP Status: `409 Conflict`

### InsufficientPermissionsError
- Thrown when user doesn't have permission to access project
- HTTP Status: `403 Forbidden`

### InvalidProjectDataError
- Thrown when project data validation fails
- HTTP Status: `400 Bad Request`

### ProjectOperationFailedError
- Thrown when project operation fails
- HTTP Status: `500 Internal Server Error` 