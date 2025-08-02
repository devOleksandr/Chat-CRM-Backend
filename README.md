# Chat CRM Backend

Backend API для Chat CRM системи з проектною архітектурою.

## 🏗️ Архітектура

- **Користувачі**: Тільки адміністратори (Role.Admin)
- **Проекти**: Кожен адмін може створювати проекти з унікальними ID
- **База даних**: PostgreSQL з Prisma ORM
- **Фреймворк**: NestJS з TypeScript

## 🚀 Швидкий старт

### Вимоги

- Docker & Docker Compose
- Node.js 24+
- npm або yarn

### Налаштування

1. **Клонуйте репозиторій**
   ```bash
   git clone <repository-url>
   cd Chat-CRM-Backend
   ```

2. **Створіть файл .env**
   ```bash
   cp .env.example .env
   ```
   
   Налаштуйте змінні в `.env` файлі:
   ```env
   # Database Configuration
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   POSTGRES_DB=chat_crm
   POSTGRES_PORT=5432
   
   # Application Configuration
   NODE_ENV=development
   API_PORT=5000
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ```

3. **Запустіть проект**
   ```bash
   make rebuild_local
   ```

### Команди Make

```bash
# Локальна розробка
make rebuild_local          # Повна перезбірка (стандартна)
make rebuild_local_clean    # Чиста перезбірка (скидання БД)
make rebuild_ubuntu_server  # Перезбірка для Ubuntu сервера

# Staging
make rebuild_stage          # Повна staging перезбірка

# Production
make rebuild_prod           # Повна production перезбірка

# Утиліти
make logs                   # Показати логи
make status                 # Перевірити статус
make db_reset               # Скинути базу даних
make db_studio              # Відкрити Prisma Studio
```

## 📊 База даних

### Міграції

```bash
# Створити нову міграцію
npx prisma migrate dev --name migration_name

# Застосувати міграції
npx prisma migrate deploy

# Скинути базу даних
npx prisma migrate reset
```

### Seed

При першому запуску автоматично створюється адмін користувач та демо проект:
- **Email**: admin@chat-crm.com
- **Password**: admin123
- **Demo Project**: "Demo Project" з ID "DEMO-001"

## 🔧 Розробка

### Структура проекту

```
src/
├── auth/           # Аутентифікація та авторизація
├── user/           # Управління користувачами
├── prisma/         # Prisma конфігурація
└── main.ts         # Точка входу
```

### API Endpoints

- `POST /auth/login` - Вхід в систему
- `POST /auth/refresh` - Оновлення токена
- `GET /user/profile` - Профіль користувача
- `PUT /user/profile` - Оновлення профілю

## 🐳 Docker

### Локальна розробка

```bash
# Запустити
docker-compose up -d

# Зупинити
docker-compose down

# Переглянути логи
docker-compose logs -f
```

### Production

```bash
# Запустити production
docker-compose -f docker-compose.prod.yml up -d

# Зупинити production
docker-compose -f docker-compose.prod.yml down
```

## 🧪 Тестування

```bash
# Unit тести
npm run test

# E2E тести
npm run test:e2e

# Покриття коду
npm run test:cov
```

## 📝 Логування

Логи зберігаються в контейнерах Docker. Для перегляду:

```bash
# Логи API
docker logs chat-crm-api_local

# Логи бази даних
docker logs chat-crm-db_local
```

## 🔒 Безпека

- JWT токени для аутентифікації
- Хешування паролів з bcrypt
- Валідація вхідних даних з class-validator
- CORS налаштування
- Rate limiting (можна додати)

## 📈 Моніторинг

- Health checks для Docker контейнерів
- Prisma Studio для перегляду бази даних
- Swagger документація API

## 🤝 Розробка

1. Створіть feature branch
2. Внесіть зміни
3. Створіть міграцію якщо потрібно
4. Запустіть тести
5. Створіть Pull Request

## 📄 Ліцензія

Цей проект є приватним і не підлягає публічному розповсюдженню. 