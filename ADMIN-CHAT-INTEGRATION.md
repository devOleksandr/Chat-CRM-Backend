# 📚 Документація API для адміністратора чат-системи

## 🔑 Авторизація

Всі endpoints для адміна вимагають JWT токен в заголовку:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Базовий URL:** `http://localhost:5055/api`

## 🏗️ Повний цикл роботи з чатом

### 1. 📋 Отримання списку проектів

**Endpoint:** `GET /projects`

```bash
curl -X GET "http://localhost:5055/api/projects" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Відповідь:**
```json
{
  "projects": [
    {
      "id": 2,
      "name": "Test Project",
      "uniqueId": "TEST-001",
      "createdBy": {
        "id": 1,
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@chat-crm.com"
      },
      "createdAt": "2025-08-03T12:29:34.761Z"
    }
  ],
  "total": 1
}
```

### 2. 👥 Отримання учасників проекту

**Endpoint:** `GET /project-participants/project/{projectId}`

```bash
curl -X GET "http://localhost:5055/api/project-participants/project/2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Параметри запиту:**
- `limit` (optional) - кількість учасників (default: 20)
- `offset` (optional) - зсув для пагінації (default: 0)

**Відповідь:**
```json
[
  {
    "id": 5,
    "projectId": 2,
    "userId": 7,
    "participantId": "test_participant_123",
    "firstName": "Тест",
    "lastName": "Учасник",
    "email": "test.participant@example.com",
    "isOnline": false,
    "lastSeen": null,
    "createdAt": "2025-08-06T19:42:16.564Z"
  }
]
```

### 3. 💬 Створення або отримання чату

**Endpoint:** `POST /chat/project/{projectId}/participant/{participantUserId}`

```bash
curl -X POST "http://localhost:5055/api/chat/project/2/participant/7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Параметри URL:**
- `projectId` - ID проекту (з endpoint `/projects`)
- `participantUserId` - ID користувача учасника (поле `userId` з endpoint учасників)

**Відповідь:**
```json
{
  "chat": {
    "id": 14,
    "projectId": 2,
    "project": {
      "id": 2,
      "name": "Test Project",
      "uniqueId": "TEST-001"
    },
    "admin": {
      "id": 1,
      "email": "admin@chat-crm.com",
      "firstName": "Admin",
      "lastName": "User",
      "uniqueId": null,
      "isOnline": true,
      "lastSeen": null
    },
    "participant": {
      "id": 7,
      "email": "test.participant@example.com",
      "firstName": "Тест",
      "lastName": "Учасник",
      "uniqueId": "test_participant_123",
      "isOnline": false,
      "lastSeen": null
    },
    "createdAt": "2025-08-06T19:42:46.170Z",
    "updatedAt": "2025-08-06T19:42:46.170Z",
    "isActive": true,
    "unreadCount": 0
  },
  "metadata": {
    "isNewChat": true,
    "message": "Chat created successfully",
    "createdAt": "2025-08-06T19:42:46.170Z",
    "accessedAt": "2025-08-06T19:42:46.179Z"
  }
}
```

### 4. 📤 Відправка повідомлення

**Endpoint:** `POST /chat/{chatId}/messages`

```bash
curl -X POST "http://localhost:5055/api/chat/14/messages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Привіт! Як справи з проектом?",
    "type": "TEXT"
  }'
```

**Тіло запиту:**
```json
{
  "content": "Привіт! Як справи з проектом?",
  "type": "TEXT",
  "metadata": {
    "fileUrl": "https://example.com/file.jpg",
    "fileName": "image.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

**Типи повідомлень:**
- `TEXT` - текстове повідомлення
- `IMAGE` - зображення
- `FILE` - файл

**Відповідь:**
```json
{
  "id": 18,
  "chatId": 14,
  "senderId": 1,
  "content": "Привіт! Як справи з проектом?",
  "type": "TEXT",
  "metadata": null,
  "read": false,
  "readAt": null,
  "createdAt": "2025-08-06T19:43:02.264Z",
  "sender": {
    "id": 1,
    "email": "admin@chat-crm.com",
    "firstName": "Admin",
    "lastName": "User",
    "uniqueId": null,
    "isOnline": true,
    "lastSeen": null
  }
}
```

### 5. 📥 Отримання повідомлень чату

**Endpoint:** `GET /chat/{chatId}/messages`

```bash
curl -X GET "http://localhost:5055/api/chat/14/messages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Параметри запиту:**
- `limit` (optional) - кількість повідомлень (default: 20)
- `offset` (optional) - зсув для пагінації (default: 0)

**Відповідь:**
```json
{
  "messages": [
    {
      "id": 18,
      "chatId": 14,
      "senderId": 1,
      "content": "Привіт! Як справи з проектом?",
      "type": "TEXT",
      "metadata": null,
      "read": false,
      "readAt": null,
      "createdAt": "2025-08-06T19:43:02.264Z",
      "sender": {
        "id": 1,
        "email": "admin@chat-crm.com",
        "firstName": "Admin",
        "lastName": "User",
        "uniqueId": null,
        "isOnline": true,
        "lastSeen": null
      }
    }
  ],
  "totalCount": 1,
  "limit": 20,
  "offset": 0
}
```

### 6. 📋 Отримання всіх чатів адміна

**Endpoint:** `GET /chat`

```bash
curl -X GET "http://localhost:5055/api/chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Параметри запиту:**
- `projectId` (optional) - фільтр по ID проекту
- `limit` (optional) - кількість чатів (default: 20)
- `offset` (optional) - зсув для пагінації (default: 0)

**Відповідь:**
```json
[
  {
    "id": 14,
    "projectId": 2,
    "project": {
      "id": 2,
      "name": "Test Project",
      "uniqueId": "TEST-001"
    },
    "admin": {
      "id": 1,
      "email": "admin@chat-crm.com",
      "firstName": "Admin",
      "lastName": "User"
    },
    "participant": {
      "id": 7,
      "email": "test.participant@example.com",
      "firstName": "Тест",
      "lastName": "Учасник",
      "uniqueId": "test_participant_123"
    },
    "createdAt": "2025-08-06T19:42:46.170Z",
    "isActive": true,
    "unreadCount": 3
  }
]
```

### 7. 📂 Отримання чатів конкретного проекту

**Endpoint:** `GET /chat/project/{projectId}`

```bash
curl -X GET "http://localhost:5055/api/chat/project/2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Параметри запиту:**
- `participantId` (optional) - фільтр по ID учасника
- `limit` (optional) - кількість чатів (default: 20)
- `offset` (optional) - зсув для пагінації (default: 0)

### 8. 📖 Позначити чат як прочитаний

**Endpoint:** `PUT /chat/{chatId}/read`

```bash
curl -X PUT "http://localhost:5055/api/chat/14/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Відповідь:** `200 OK` (без тіла відповіді)

### 9. 🗑️ Деактивувати чат

**Endpoint:** `DELETE /chat/{chatId}`

```bash
curl -X DELETE "http://localhost:5055/api/chat/14" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Відповідь:** `200 OK` (без тіла відповіді)

## 🔄 Типовий флоу для фронтенду

### 1. Ініціалізація чат-інтерфейсу

```javascript
// 1. Отримати список проектів
const projects = await fetch('/api/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Отримати чати для проекту
const chats = await fetch(`/api/chat/project/${projectId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Відобразити список чатів
```

### 2. Відкриття чату

```javascript
// 1. Отримати повідомлення чату
const messages = await fetch(`/api/chat/${chatId}/messages`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Позначити як прочитаний
await fetch(`/api/chat/${chatId}/read`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Відобразити повідомлення
```

### 3. Створення нового чату

```javascript
// 1. Отримати учасників проекту
const participants = await fetch(`/api/project-participants/project/${projectId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Створити чат з учасником
const chat = await fetch(`/api/chat/project/${projectId}/participant/${participantUserId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Перейти до нового чату
```

### 4. Відправка повідомлення

```javascript
const message = await fetch(`/api/chat/${chatId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Текст повідомлення',
    type: 'TEXT'
  })
});

// Додати повідомлення до UI
```

## ⚠️ Обробка помилок

### Типові помилки:

- **401 Unauthorized** - Невалідний або застарілий JWT токен
- **403 Forbidden** - Недостатньо прав доступу
- **404 Not Found** - Чат/проект/учасник не знайдено
- **400 Bad Request** - Невалідні дані в запиті
- **500 Internal Server Error** - Помилка сервера

### Приклад обробки:

```javascript
try {
  const response = await fetch('/api/chat/123/messages', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Перенаправити на авторизацію
      redirectToLogin();
    } else if (response.status === 404) {
      // Показати повідомлення про помилку
      showError('Чат не знайдено');
    }
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  // Обробити дані
} catch (error) {
  console.error('Помилка API:', error);
  showError('Помилка завантаження даних');
}
```

## 🔐 Безпека

1. **JWT токен** зберігайте в безпечному місці (HttpOnly cookies або secure storage)
2. **Токени мають термін дії** - обробляйте 401 помилки та оновлюйте токени
3. **Валідуйте дані** перед відправкою на сервер
4. **Не зберігайте sensitive дані** в localStorage

## 📝 Примітки

- Всі дати в форматі ISO 8601 UTC
- ID завжди числові (integer)
- Поля `metadata` можуть бути `null` або містити додаткову інформацію
- `unreadCount` показує кількість непрочитаних повідомлень для адміна
- `isOnline` статус оновлюється в режимі реального часу через WebSocket