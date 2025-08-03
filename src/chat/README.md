# Chat Module

Модуль чату для системи "The Little Black Book" з підтримкою текстових повідомлень, зображень та файлів.

## Можливості

- ✅ Текстові повідомлення
- ✅ Зображення (нові!)
- ✅ Файли
- ✅ Емодзі
- ✅ Системні повідомлення
- ✅ WebSocket для real-time комунікації
- ✅ REST API
- ✅ Автоматичне визначення типу повідомлення
- ✅ Валідація файлів зображень

## Типи повідомлень

### TEXT
Звичайні текстові повідомлення (максимум 1000 символів).

### IMAGE
Зображення з підтримкою наступних форматів:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- SVG (.svg)

### FILE
Інші типи файлів (документи, відео, аудіо тощо).

### EMOJI
Емодзі повідомлення.

### SYSTEM
Системні повідомлення.

## API Endpoints

### REST API

#### Отримання списку чатів
```bash
GET /chat?limit=20&offset=0&role=CUSTOMER
```

#### Отримання повідомлень чату
```bash
GET /chat/{chatId}/messages?limit=20&offset=0
```

#### Відправка повідомлення
```bash
POST /chat/{chatId}/messages
{
  "content": "Текст повідомлення",
  "type": "TEXT"
}
```

#### Відправка зображення
```bash
POST /chat/{chatId}/messages
{
  "content": "https://storage.googleapis.com/bucket/chat/1/uuid.jpg",
  "type": "IMAGE",
  "metadata": {
    "fileUrl": "https://storage.googleapis.com/bucket/chat/1/uuid.jpg",
    "fileName": "photo.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "originalName": "my_photo.jpg"
  }
}
```

### WebSocket

#### Підключення
```javascript
const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Відправка повідомлення
```javascript
socket.emit('sendMessage', {
  chatId: 1,
  content: 'Текст повідомлення',
  type: 'TEXT'
});
```

#### Відправка зображення
```javascript
socket.emit('sendMessage', {
  chatId: 1,
  content: 'https://storage.googleapis.com/bucket/chat/1/uuid.jpg',
  type: 'IMAGE',
  metadata: {
    fileUrl: 'https://storage.googleapis.com/bucket/chat/1/uuid.jpg',
    fileName: 'photo.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    originalName: 'my_photo.jpg'
  }
});
```

## Завантаження файлів

### Спеціальний endpoint для чату
```bash
POST /file-storage/chat/{chatId}/upload-url
{
  "mimeType": "image/jpeg",
  "extension": "jpg"
}
```

### Загальний endpoint
```bash
POST /file-storage/upload-url
{
  "mimeType": "image/jpeg",
  "extension": "jpg",
  "entity": "chat",
  "entityId": "1"
}
```

## Автоматичне визначення типу

Якщо не вказати тип повідомлення, система автоматично визначить його:

- Якщо `metadata.mimeType` є зображенням → `IMAGE`
- Якщо `metadata.extension` є зображенням → `IMAGE`
- Якщо `content` є URL з розширенням зображення → `IMAGE`
- Якщо є файл, але не зображення → `FILE`
- За замовчуванням → `TEXT`

## Валідація

### Зображення
- Перевірка наявності обов'язкових полів (`fileUrl`, `fileName`)
- Валідація підтримуваних форматів
- Перевірка відповідності MIME типу до розширення

### Текст
- Максимум 1000 символів для звичайного тексту
- Максимум 2000 символів для URL файлів

### Спам захист
- Максимум 30 повідомлень за 60 секунд
- Timeout для порушників

## Структура даних

### Message Entity
```typescript
interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  type: MessageType;
  metadata?: Record<string, any>;
  createdAt: Date;
  read: boolean;
  readAt?: Date;
}
```

### Image Metadata
```typescript
interface ImageMetadata {
  fileUrl: string;        // Public URL файлу в GCS
  fileName: string;       // Назва файлу в GCS
  fileSize?: number;      // Розмір файлу в байтах
  mimeType?: string;      // MIME тип файлу
  originalName?: string;  // Оригінальна назва файлу
  width?: number;         // Ширина зображення (опціонально)
  height?: number;        // Висота зображення (опціонально)
}
```

## Приклади використання

Дивіться файл `examples/image-message-examples.md` для детальних прикладів.

## Міграції

Новий тип `IMAGE` був доданий до enum `MessageType` в міграції `20250728143651_add_image_message_type`. 