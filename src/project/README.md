# Project Module

Модуль для управління проектами та їх учасниками. Реалізує Clean Architecture принципи з використанням dependency inversion principle та strategy pattern для обробки помилок.

## Структура модуля

```
src/project/
├── controllers/
│   ├── project-participant.controller.ts  # Контролер для управління учасниками проектів
│   └── project.controller.ts              # Контролер для управління проектами
├── services/
│   ├── project-participant.service.ts     # Сервіс для бізнес-логіки учасників
│   └── project.service.ts                 # Сервіс для бізнес-логіки проектів
├── repositories/
│   ├── project-participant.repository.ts  # Репозиторій для роботи з учасниками
│   └── project.repository.ts              # Репозиторій для роботи з проектами
├── ports/
│   ├── project-participant-repository.port.ts  # Порт для репозиторію учасників
│   └── project-repository.port.ts             # Порт для репозиторію проектів
├── dto/
│   ├── create-project-participant.dto.ts   # DTO для створення учасника
│   ├── project-participant-response.dto.ts # DTO для відповіді учасника
│   ├── project.dto.ts                      # DTO для проектів
│   └── project-response.dto.ts             # DTO для відповідей проектів
├── errors/
│   └── project.errors.ts                   # Класи помилок
├── strategies/
│   └── project-error.strategies.ts         # Стратегії обробки помилок
├── handlers/
│   └── project-error.handler.ts            # Обробник помилок
├── filters/
│   └── project-exception.filter.ts         # Фільтр винятків
├── project.module.ts                       # Модуль
└── index.ts                                # Експорти
```

## Основні компоненти

### ProjectParticipantController
Контролер для управління учасниками проектів. Надає REST API ендпоінти:

- `POST /project-participants/mobile` - Створення учасника (для мобільного додатку, без авторизації)
- `POST /project-participants` - Створення учасника (для адміністраторів)
- `GET /project-participants/project/:projectId` - Отримання всіх учасників проекту
- `GET /project-participants/:participantId` - Отримання конкретного учасника
- `DELETE /project-participants/:participantId` - Видалення учасника

### ProjectParticipantService
Сервіс для бізнес-логіки управління учасниками проектів:

- Створення учасників з валідацією
- Перевірка авторизації (власник проекту)
- Управління учасниками проекту
- Отримання інформації про учасників

### ProjectParticipantRepository
Репозиторій для роботи з даними учасників проектів:

- CRUD операції з учасниками
- Пошук учасників за різними критеріями
- Перевірка доступності participant ID

## Особливості реалізації

### Авторизація
- Всі операції (крім мобільного створення) потребують авторизації
- Перевірка власності проекту через `verifyProjectOwnership`
- Використання JWT токенів для аутентифікації

### Валідація
- Перевірка унікальності participant ID в межах проекту
- Валідація даних через DTO з class-validator
- Обробка помилок через strategy pattern

### Мобільний додаток
- Спеціальний ендпоінт для створення учасників без авторизації
- Використовується для мобільного додатку
- Валідація через projectUniqueId

## Залежності

- `ProjectService` - для отримання інформації про проекти
- `PrismaService` - для роботи з базою даних
- `AuthModule` - для авторизації

## Експорти

Модуль експортує:
- `ProjectService` - для використання в інших модулях
- `ProjectParticipantService` - для використання в chat модулі
- `ProjectRepositoryPort` - порт репозиторію проектів
- `PROJECT_PARTICIPANT_REPOSITORY_PORT` - токен для dependency injection

## Використання в інших модулях

### Chat Module
Chat модуль використовує `ProjectParticipantService` для:
- Отримання user ID учасника за participant ID
- Валідації учасників в чаті
- Управління статусом онлайн

```typescript
import { ProjectParticipantService } from '../project/services/project-participant.service';

constructor(
  private readonly projectParticipantService: ProjectParticipantService,
) {}
```

## Міграція з Chat Module

Project participants були перенесені з chat модуля до project модуля для:
- Кращої когезії (вся логіка проектів в одному місці)
- Зменшення залежностей між модулями
- Покращення контролю доступу
- Чистішої архітектури 