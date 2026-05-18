# Design18: Изоляция модуля Organization (Multi-Tenancy)

> **Фаза 2: Design** — архитектурное решение до начала кодинга.
> Модель C4 (контекст, контейнеры, компоненты) + DFD + sequence-диаграммы.

---

## 1. Контекст (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────┐
│                    CHSM Classroom Integrations               │
│                                                              │
│  ┌──────────────────┐                                        │
│  │  Organization     │  ← изолируемый модуль                  │
│  │  Module           │                                        │
│  └────────┬─────────┘                                        │
│           │ предоставляет IOrganizationService                │
│           ▼                                                   │
│  ┌──────────────────────────────────────────────────┐         │
│  │  Потребители:                                     │         │
│  │  • MultiTenancyGuard (проверка членства)          │         │
│  │  • AuthModule (создание OrgMember при логине)     │         │
│  │  • UsersModule (смена роли)                       │         │
│  │  • PracticesModule, EnrollmentsModule, ...        │         │
│  │    (получение currentOrgId, проверка доступа)     │         │
│  └──────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

**Цель:** Вся логика управления организациями и членством сосредоточена в одном модуле. Остальные модули общаются с ним через интерфейс `IOrganizationService`.

---

## 2. Структура модуля (C4 Level 2 — Контейнеры)

```
src/organization/
├── organization.module.ts
├── organization.service.ts                       ← реализация бизнес-логики
├── organization.controller.ts                    ← эндпоинты суперадминистратора
│
├── interfaces/
│   ├── organization.repository.interface.ts      ← контракт репозитория
│   └── organization.service.interface.ts         ← контракт сервиса (для внешних потребителей)
│
├── repositories/
│   └── prisma-organization.repository.ts         ← работа с БД через Prisma
│
├── dto/
│   ├── create-organization.dto.ts
│   ├── update-organization.dto.ts
│   ├── organization-list-query.dto.ts
│   ├── organization-response.dto.ts
│   ├── org-member-response.dto.ts
│   ├── add-user-to-org.dto.ts
│   └── update-user-role.dto.ts
│
└── mappers/
    ├── organization.mapper.ts                   ← Organization → DTO
    └── org-member.mapper.ts                     ← OrgMember → DTO
```

---

## 3. DTO (Data Transfer Objects)

### 3.1. CreateOrganizationDto

```typescript
// src/organization/dto/create-organization.dto.ts

export class CreateOrganizationDto {
  slug: string;                    // уникальный, человекочитаемый идентификатор
  name: string;                    // название школы
  domain?: string;                 // опциональный домен
  googleWorkspaceId?: string;      // домен Google Workspace
  plan?: 'free' | 'pro' | 'enterprise';  // default: 'free'
  settings?: Record<string, any>;  // произвольные настройки
}
```

### 3.2. UpdateOrganizationDto

```typescript
// src/organization/dto/update-organization.dto.ts

export class UpdateOrganizationDto {
  name?: string;
  domain?: string;
  googleWorkspaceId?: string;
  classroomConfig?: Record<string, any>;
  telegramBotToken?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
}
```

### 3.3. OrganizationListQueryDto

```typescript
// src/organization/dto/organization-list-query.dto.ts

export class OrganizationListQueryDto {
  search?: string;      // поиск по name / slug
  plan?: string;        // фильтр по тарифу
  limit?: number;       // пагинация
  offset?: number;
}
```

### 3.4. OrganizationResponseDto

```typescript
// src/organization/dto/organization-response.dto.ts

export class OrganizationResponseDto {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  googleWorkspaceId: string | null;
  plan: string;
  settings: Record<string, any>;
  createdAt: Date;
  membersCount?: number;  // опционально: количество участников
}
```

### 3.5. OrgMemberResponseDto

```typescript
// src/organization/dto/org-member-response.dto.ts

export class OrgMemberResponseDto {
  id: string;
  organizationId: string;
  userId: number;              // User.id (Int)
  userMongoId: string;         // User.mongoId (для идентификации в системе)
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  role: 'OWNER' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'VIEWER';
  createdAt: Date;
}
```

### 3.6. AddUserToOrgDto

```typescript
// src/organization/dto/add-user-to-org.dto.ts

export class AddUserToOrgDto {
  userId: number;              // User.id (Int)
  role: 'OWNER' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'VIEWER';
}
```

### 3.7. UpdateUserRoleDto

```typescript
// src/organization/dto/update-user-role.dto.ts

export class UpdateUserRoleDto {
  role: 'OWNER' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'VIEWER';
}
```

---

## 4. Mappers

### 4.1. OrganizationMapper

```typescript
// src/organization/mappers/organization.mapper.ts

import { Organization as PrismaOrganization } from '@prisma/client';
import { OrganizationResponseDto } from '../dto/organization-response.dto';

export class OrganizationMapper {
  static toResponseDto(
    org: PrismaOrganization,
    membersCount?: number,
  ): OrganizationResponseDto {
    return {
      id: org.id,
      slug: org.slug,
      name: org.name,
      domain: org.domain ?? null,
      googleWorkspaceId: org.googleWorkspaceId ?? null,
      plan: org.plan,
      settings: org.settings as Record<string, any>,
      createdAt: org.createdAt,
      ...(membersCount !== undefined && { membersCount }),
    };
  }

  static toResponseDtoList(
    orgs: PrismaOrganization[],
  ): OrganizationResponseDto[] {
    return orgs.map((org) => OrganizationMapper.toResponseDto(org));
  }
}
```

### 4.2. OrgMemberMapper

```typescript
// src/organization/mappers/org-member.mapper.ts

import { OrgMember as PrismaOrgMember } from '@prisma/client';
import { OrgMemberResponseDto } from '../dto/org-member-response.dto';

// Расширенный тип, включающий связанные данные User
type OrgMemberWithUser = PrismaOrgMember & {
  user?: {
    id: number;
    mongoId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
};

export class OrgMemberMapper {
  static toResponseDto(member: OrgMemberWithUser): OrgMemberResponseDto {
    return {
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      userMongoId: member.user?.mongoId ?? '',
      userFirstName: member.user?.firstName ?? null,
      userLastName: member.user?.lastName ?? null,
      userEmail: member.user?.email ?? null,
      role: member.role as OrgMemberResponseDto['role'],
      createdAt: member.createdAt,
    };
  }

  static toResponseDtoList(
    members: OrgMemberWithUser[],
  ): OrgMemberResponseDto[] {
    return members.map((m) => OrgMemberMapper.toResponseDto(m));
  }
}
```

---

## 5. Интерфейсы

### 5.1. IOrganizationRepository

```typescript
// src/organization/interfaces/organization.repository.interface.ts

import { Organization, OrgMember } from '@prisma/client';
import { OrgMemberRole } from '@prisma/client';

export interface IOrganizationRepository {
  // ── Organization CRUD ──
  create(data: {
    slug: string;
    name: string;
    domain?: string;
    googleWorkspaceId?: string;
    plan?: string;
    settings?: any;
  }): Promise<Organization>;

  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findAll(query?: {
    search?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<Organization[]>;

  update(
    id: string,
    data: Partial<{
      name: string;
      domain: string;
      googleWorkspaceId: string;
      classroomConfig: any;
      telegramBotToken: string;
      plan: string;
      settings: any;
    }>,
  ): Promise<Organization>;

  delete(id: string): Promise<void>;

  // ── OrgMember management ──
  addMember(orgId: string, userId: number, role: OrgMemberRole): Promise<OrgMember>;
  findMember(orgId: string, userId: number): Promise<OrgMember | null>;
  updateMemberRole(orgId: string, userId: number, role: OrgMemberRole): Promise<OrgMember>;
  removeMember(orgId: string, userId: number): Promise<void>;
  getMembers(orgId: string): Promise<(OrgMember & { user?: any })[]>;
  getMembersCount(orgId: string): Promise<number>;
}
```

### 5.2. IOrganizationService

```typescript
// src/organization/interfaces/organization.service.interface.ts

import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  OrgMemberResponseDto,
  AddUserToOrgDto,
  UpdateUserRoleDto,
} from '../dto';

export interface IOrganizationService {
  // ── Organization CRUD ──
  create(dto: CreateOrganizationDto): Promise<OrganizationResponseDto>;
  findById(id: string): Promise<OrganizationResponseDto>;
  findBySlug(slug: string): Promise<OrganizationResponseDto>;
  findAll(query?: OrganizationListQueryDto): Promise<OrganizationResponseDto[]>;
  update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationResponseDto>;
  delete(id: string): Promise<void>;

  // ── Member management ──
  addUserToOrg(orgId: string, dto: AddUserToOrgDto): Promise<OrgMemberResponseDto>;
  updateUserRoleInOrg(
    orgId: string,
    userId: number,
    dto: UpdateUserRoleDto,
  ): Promise<OrgMemberResponseDto>;
  removeUserFromOrg(orgId: string, userId: number): Promise<void>;
  getOrgMembers(orgId: string): Promise<OrgMemberResponseDto[]>;
  getMember(orgId: string, userId: number): Promise<OrgMemberResponseDto | null>;

  // ── Query helpers (для других модулей) ──
  getDefaultOrganization(): Promise<OrganizationResponseDto>;
  isMember(orgId: string, userId: number): Promise<boolean>;
}
```

---

## 6. Sequence-диаграммы

### 6.1. Создание организации (суперадминистратор)

```
Client                  OrganizationController     OrganizationService    OrganizationRepository     Prisma
  │                           │                         │                       │                   │
  │  POST /admin/organizations │                         │                       │                   │
  │  { slug, name, plan }      │                         │                       │                   │
  │──────────────────────────►│                         │                       │                   │
  │                           │  create(dto)            │                       │                   │
  │                           │────────────────────────►│                       │                   │
  │                           │                         │  create(data)          │                   │
  │                           │                         │───────────────────────►│                   │
  │                           │                         │                       │  prisma.org.create │
  │                           │                         │                       │──────────────────►│
  │                           │                         │                       │◄──────────────────│
  │                           │                         │◄──────────────────────│                   │
  │                           │                         │  OrganizationMapper    │                   │
  │                           │                         │  .toResponseDto()      │                   │
  │                           │◄────────────────────────│                       │                   │
  │  OrganizationResponseDto  │                         │                       │                   │
  │◄─────────────────────────│                         │                       │                   │
```

### 6.2. Добавление пользователя в организацию + смена роли

```
Client                  OrganizationController     OrganizationService      OrgMemberMapper      Repository
  │                           │                         │                       │                   │
  │ POST /admin/orgs/:id/members                        │                       │                   │
  │ { userId, role }          │                         │                       │                   │
  │──────────────────────────►│                         │                       │                   │
  │                           │  addUserToOrg(orgId,    │                       │                   │
  │                           │    addUserToOrgDto)     │                       │                   │
  │                           │────────────────────────►│                       │                   │
  │                           │                         │  check: findMember()  │                   │
  │                           │                         │───────────────────────│──────────────────►│
  │                           │                         │◄──────────────────────│──────────────────│
  │                           │                         │  if exists → update    │                   │
  │                           │                         │  if not → addMember() │                   │
  │                           │                         │───────────────────────│──────────────────►│
  │                           │                         │◄──────────────────────│──────────────────│
  │                           │                         │                       │                   │
  │                           │                         │  toResponseDto()      │                   │
  │                           │                         │──────────────────────►│                   │
  │                           │                         │◄──────────────────────│                   │
  │                           │◄────────────────────────│                       │                   │
  │ OrgMemberResponseDto      │                         │                       │                   │
  │◄─────────────────────────│                         │                       │                   │
```

### 6.3. Как другие модули будут использовать OrganizationService

```
SomeOtherService                       IOrganizationService (injected)
       │                                         │
       │  // Проверить членство                   │
       │  isMember(orgId, userId)                 │
       │────────────────────────────────────────►│
       │◄────────────────────────────────────────│
       │                                         │
       │  // Получить организацию по slug         │
       │  findBySlug('chsm_brass_eu')             │
       │────────────────────────────────────────►│
       │◄────────────────────────────────────────│
       │                                         │
       │  // Получить роль пользователя в org     │
       │  getMember(orgId, userId)                │
       │────────────────────────────────────────►│
       │◄────────────────────────────────────────│
```

---

## 7. Реализация OrganizationService

```typescript
// src/organization/organization.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { IOrganizationService } from './interfaces/organization.service.interface';
import { IOrganizationRepository } from './interfaces/organization.repository.interface';
import { OrganizationMapper } from './mappers/organization.mapper';
import { OrgMemberMapper } from './mappers/org-member.mapper';
import { OrgMemberRole } from '@prisma/client';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  OrgMemberResponseDto,
  AddUserToOrgDto,
  UpdateUserRoleDto,
} from './dto';

@Injectable()
export class OrganizationService implements IOrganizationService {
  private readonly defaultOrgSlug = 'chsm_brass_eu';

  constructor(
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  // ──────────────────────────────────────────────
  //  Organization CRUD
  // ──────────────────────────────────────────────

  async create(dto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    const existing = await this.orgRepo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Organization with slug "${dto.slug}" already exists`);
    }

    const org = await this.orgRepo.create({
      slug: dto.slug,
      name: dto.name,
      domain: dto.domain,
      googleWorkspaceId: dto.googleWorkspaceId,
      plan: dto.plan ?? 'free',
      settings: dto.settings ?? {},
    });

    return OrganizationMapper.toResponseDto(org);
  }

  async findById(id: string): Promise<OrganizationResponseDto> {
    const org = await this.orgRepo.findById(id);
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }
    return OrganizationMapper.toResponseDto(org);
  }

  async findBySlug(slug: string): Promise<OrganizationResponseDto> {
    const org = await this.orgRepo.findBySlug(slug);
    if (!org) {
      throw new NotFoundException(`Organization with slug "${slug}" not found`);
    }
    return OrganizationMapper.toResponseDto(org);
  }

  async findAll(query?: OrganizationListQueryDto): Promise<OrganizationResponseDto[]> {
    const orgs = await this.orgRepo.findAll({
      search: query?.search,
      plan: query?.plan,
      limit: query?.limit,
      offset: query?.offset,
    });
    return OrganizationMapper.toResponseDtoList(orgs);
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationResponseDto> {
    const existing = await this.orgRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    const updated = await this.orgRepo.update(id, dto);
    return OrganizationMapper.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.orgRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }
    await this.orgRepo.delete(id);
  }

  // ──────────────────────────────────────────────
  //  Member management
  // ──────────────────────────────────────────────

  async addUserToOrg(orgId: string, dto: AddUserToOrgDto): Promise<OrgMemberResponseDto> {
    // Проверяем, что организация существует
    const org = await this.orgRepo.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    // Проверяем, не состоит ли уже пользователь в организации
    const existingMember = await this.orgRepo.findMember(orgId, dto.userId);
    if (existingMember) {
      throw new ConflictException(
        `User ${dto.userId} is already a member of organization "${orgId}"`,
      );
    }

    const member = await this.orgRepo.addMember(orgId, dto.userId, dto.role as OrgMemberRole);
    return OrgMemberMapper.toResponseDto(member);
  }

  async updateUserRoleInOrg(
    orgId: string,
    userId: number,
    dto: UpdateUserRoleDto,
  ): Promise<OrgMemberResponseDto> {
    const member = await this.orgRepo.findMember(orgId, userId);
    if (!member) {
      throw new NotFoundException(
        `User ${userId} is not a member of organization "${orgId}"`,
      );
    }

    const updated = await this.orgRepo.updateMemberRole(orgId, userId, dto.role as OrgMemberRole);
    return OrgMemberMapper.toResponseDto(updated);
  }

  async removeUserFromOrg(orgId: string, userId: number): Promise<void> {
    const member = await this.orgRepo.findMember(orgId, userId);
    if (!member) {
      throw new NotFoundException(
        `User ${userId} is not a member of organization "${orgId}"`,
      );
    }
    await this.orgRepo.removeMember(orgId, userId);
  }

  async getOrgMembers(orgId: string): Promise<OrgMemberResponseDto[]> {
    const org = await this.orgRepo.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    const members = await this.orgRepo.getMembers(orgId);
    return OrgMemberMapper.toResponseDtoList(members);
  }

  async getMember(orgId: string, userId: number): Promise<OrgMemberResponseDto | null> {
    const member = await this.orgRepo.findMember(orgId, userId);
    if (!member) return null;
    return OrgMemberMapper.toResponseDto(member);
  }

  // ──────────────────────────────────────────────
  //  Query helpers
  // ──────────────────────────────────────────────

  async getDefaultOrganization(): Promise<OrganizationResponseDto> {
    return this.findBySlug(this.defaultOrgSlug);
  }

  async isMember(orgId: string, userId: number): Promise<boolean> {
    const member = await this.orgRepo.findMember(orgId, userId);
    return member !== null;
  }
}
```

---

## 8. Реализация PrismaOrganizationRepository

```typescript
// src/organization/repositories/prisma-organization.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Organization, OrgMember, OrgMemberRole, Prisma } from '@prisma/client';
import { IOrganizationRepository } from '../interfaces/organization.repository.interface';

@Injectable()
export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Organization CRUD ──

  async create(data: {
    slug: string;
    name: string;
    domain?: string;
    googleWorkspaceId?: string;
    plan?: string;
    settings?: any;
  }): Promise<Organization> {
    return this.prisma.organization.create({ data });
  }

  async findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  async findAll(query?: {
    search?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<Organization[]> {
    const where: Prisma.OrganizationWhereInput = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.plan) {
      where.plan = query.plan;
    }

    return this.prisma.organization.findMany({
      where,
      take: query?.limit,
      skip: query?.offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      domain: string;
      googleWorkspaceId: string;
      classroomConfig: any;
      telegramBotToken: string;
      plan: string;
      settings: any;
    }>,
  ): Promise<Organization> {
    return this.prisma.organization.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organization.delete({ where: { id } });
  }

  // ── OrgMember management ──

  async addMember(
    orgId: string,
    userId: number,
    role: OrgMemberRole,
  ): Promise<OrgMember> {
    return this.prisma.orgMember.create({
      data: {
        organizationId: orgId,
        userId,
        role,
      },
      include: { user: true },
    });
  }

  async findMember(orgId: string, userId: number): Promise<OrgMember | null> {
    return this.prisma.orgMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });
  }

  async updateMemberRole(
    orgId: string,
    userId: number,
    role: OrgMemberRole,
  ): Promise<OrgMember> {
    return this.prisma.orgMember.update({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      data: { role },
      include: { user: true },
    });
  }

  async removeMember(orgId: string, userId: number): Promise<void> {
    await this.prisma.orgMember.delete({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });
  }

  async getMembers(
    orgId: string,
  ): Promise<(OrgMember & { user?: any })[]> {
    return this.prisma.orgMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            mongoId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMembersCount(orgId: string): Promise<number> {
    return this.prisma.orgMember.count({
      where: { organizationId: orgId },
    });
  }
}
```

---

## 9. Контроллер (суперадминистратор, без guards)

```typescript
// src/organization/organization.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  OrgMemberResponseDto,
  AddUserToOrgDto,
  UpdateUserRoleDto,
} from './dto';

@Controller('admin/organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  // ── Organization CRUD ──

  @Post()
  async create(@Body() dto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    return this.orgService.create(dto);
  }

  @Get()
  async findAll(
    @Query() query: OrganizationListQueryDto,
  ): Promise<OrganizationResponseDto[]> {
    return this.orgService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<OrganizationResponseDto> {
    return this.orgService.findById(id);
  }

  @Get('by-slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<OrganizationResponseDto> {
    return this.orgService.findBySlug(slug);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.orgService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.orgService.delete(id);
  }

  // ── Members management ──

  @Post(':id/members')
  async addUserToOrg(
    @Param('id') orgId: string,
    @Body() dto: AddUserToOrgDto,
  ): Promise<OrgMemberResponseDto> {
    return this.orgService.addUserToOrg(orgId, dto);
  }

  @Get(':id/members')
  async getOrgMembers(
    @Param('id') orgId: string,
  ): Promise<OrgMemberResponseDto[]> {
    return this.orgService.getOrgMembers(orgId);
  }

  @Patch(':id/members/:userId/role')
  async updateUserRoleInOrg(
    @Param('id') orgId: string,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<OrgMemberResponseDto> {
    return this.orgService.updateUserRoleInOrg(orgId, userId, dto);
  }

  @Delete(':id/members/:userId')
  async removeUserFromOrg(
    @Param('id') orgId: string,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return this.orgService.removeUserFromOrg(orgId, userId);
  }
}
```

**Эндпоинты:**

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/admin/organizations` | Создать организацию |
| GET | `/admin/organizations` | Список организаций (с фильтрами) |
| GET | `/admin/organizations/:id` | Организация по ID |
| GET | `/admin/organizations/by-slug/:slug` | Организация по slug |
| PATCH | `/admin/organizations/:id` | Обновить организацию |
| DELETE | `/admin/organizations/:id` | Удалить организацию |
| POST | `/admin/organizations/:id/members` | Добавить пользователя |
| GET | `/admin/organizations/:id/members` | Список участников |
| PATCH | `/admin/organizations/:id/members/:userId/role` | Сменить роль |
| DELETE | `/admin/organizations/:id/members/:userId` | Удалить участника |

---

## 10. Модуль OrganizationModule

```typescript
// src/organization/organization.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { PrismaOrganizationRepository } from './repositories/prisma-organization.repository';
import { IOrganizationRepository } from './interfaces/organization.repository.interface';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    {
      provide: IOrganizationRepository,
      useClass: PrismaOrganizationRepository,
    },
  ],
  exports: [OrganizationService], // ← экспортируем для внедрения в другие модули
})
export class OrganizationModule {}
```

---

## 11. Как другие модули будут использовать OrganizationService

### 11.1. Внедрение через DI

```typescript
// В любом другом модуле:
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationService } from '../organization/organization.service';

@Module({
  imports: [OrganizationModule],  // ← импортируем модуль
  providers: [SomeService],
})
export class SomeModule {}
```

```typescript
// В сервисе-потребителе:
import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class SomeService {
  constructor(
    private readonly orgService: OrganizationService,
  ) {}

  async someMethod() {
    // Проверка членства
    const isMember = await this.orgService.isMember(orgId, userId);

    // Получение организации по slug (вместо хардкода)
    const defaultOrg = await this.orgService.getDefaultOrganization();

    // Поиск участника
    const member = await this.orgService.getMember(orgId, userId);
  }
}
```

### 11.2. Что изменится в существующем коде

**MultiTenancyGuard** — будет использовать `OrganizationService` вместо прямого `PrismaService`:
```typescript
// Было:
const defaultOrg = await this.prisma.organization.findUnique({ where: { slug: 'chsm_brass_eu' } });

// Стало:
const defaultOrg = await this.orgService.getDefaultOrganization();
```

**PrismaUserRepository.save()** — будет вызывать `OrganizationService` вместо прямого upsert OrgMember:
```typescript
// Было:
await this.prisma.orgMember.upsert({ ... });

// Стало:
const org = organizationId
  ? await this.orgService.findById(organizationId)
  : await this.orgService.getDefaultOrganization();
await this.orgService.addUserToOrg(org.id, { userId: doc.id, role: 'STUDENT' });
```

**UserService.changeRole()** — будет делегировать смену роли в `OrganizationService`:
```typescript
// Было:
await this.repo.updateOrgMemberRole(id, organizationId, role);

// Стало:
await this.orgService.updateUserRoleInOrg(organizationId, userIntId, { role });
```

---

## 12. DFD (Data Flow Diagram) — поток данных через изолированный модуль

```
                        ┌─────────────────────────┐
                        │   External Consumers     │
                        │ (другие модули)          │
                        └──────────┬──────────────┘
                                   │ вызывает методы
                                   ▼
                    ┌──────────────────────────────┐
                    │   IOrganizationService        │
                    │   (интерфейс — контракт)      │
                    └──────────┬───────────────────┘
                               │ implements
                    ┌──────────▼───────────────────┐
                    │   OrganizationService         │
                    │   (бизнес-логика)             │
                    │                              │
                    │   • валидация                 │
                    │   • проверка прав (в буд.)   │
                    │   • вызов репозитория         │
                    │   • маппинг → DTO             │
                    └──────────┬───────────────────┘
                               │ делегирует
                    ┌──────────▼───────────────────┐
                    │   IOrganizationRepository     │
                    │   (интерфейс — контракт)      │
                    └──────────┬───────────────────┘
                               │ implements
                    ┌──────────▼───────────────────┐
                    │   PrismaOrganizationRepo     │
                    │   (Prisma → БД)              │
                    └──────────┬───────────────────┘
                               │ SQL
                    ┌──────────▼───────────────────┐
                    │   PostgreSQL                  │
                    │   (organizations, org_members)│
                    └──────────────────────────────┘
```

---

## 13. План миграции (из текущего состояния)

### Фаза 2.1 — Создание модуля

1. Создать структуру папок и файлов по схеме выше
2. Реализовать DTO, Mappers, Interfaces
3. Реализовать `PrismaOrganizationRepository`
4. Реализовать `OrganizationService`
5. Реализовать `OrganizationController` (без guards)
6. Собрать `OrganizationModule` и импортировать в `AppModule`
7. Проверить эндпоинты суперадминистратора

### Фаза 2.2 — Интеграция (следующий этап)

1. Внедрить `OrganizationService` в `MultiTenancyGuard`
2. Внедрить в `PrismaUserRepository` — заменить прямой upsert `OrgMember`
3. Внедрить в `UserService` — заменить `updateOrgMemberRole()`
4. Удалить дублирующийся код из `PrismaUserRepository`
5. Добавить guards в контроллер
6. Удалить хардкод `'chsm_brass_eu'` из guards и репозитория

---

## 14. Резюме: что даёт изоляция

| Аспект | Было (размазано по коду) | Стало (централизовано) |
|--------|-------------------------|----------------------|
| Создание организации | Нет эндпоинта | `POST /admin/organizations` |
| Управление участниками | В `PrismaUserRepository` | `OrganizationService` |
| Дефолтная организация | Хардкод в 2 местах | Единый метод `.getDefaultOrganization()` |
| Смена роли | Прямой SQL в репозитории | `.updateUserRoleInOrg()` |
| Проверка членства | В `MultiTenancyGuard` | `.isMember()` |
| Ответы | Прямые Prisma-сущности | DTO через Mappers |
| Тестируемость | Hard (всё завязано на Prisma) | Легко (mock интерфейса) |
