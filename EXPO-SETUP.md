# 🔧 Налаштування Expo Push Notifications

## 📋 Що потрібно налаштувати

### 1. **EXPO_PUBLIC_PROJECT_ID** (ОБОВ'ЯЗКОВО)
Це унікальний ідентифікатор вашого Expo проекту.

#### Як отримати:
1. Зайдіть на [expo.dev](https://expo.dev)
2. Створіть новий проект або виберіть існуючий
3. Скопіюйте Project ID з URL або налаштувань

**Приклад**: `https://expo.dev/@username/project-name` → Project ID: `project-name`

### 2. **EXPO_ACCESS_TOKEN** (РЕКОМЕНДУЄТЬСЯ)
Для приватних проектів та кращого контролю.

#### Як отримати:
1. Зайдіть в [Account Settings](https://expo.dev/accounts/[username]/settings/access-tokens)
2. Створіть новий access token
3. Скопіюйте токен

## 🚀 Швидке налаштування

### 1. Створіть `.env` файл в корені проекту:

```bash
# .env
EXPO_PUBLIC_PROJECT_ID="your-project-id-here"
EXPO_ACCESS_TOKEN="your-access-token-here"

# Опціонально
EXPO_PUSH_RATE_LIMIT=100
EXPO_PUSH_BATCH_SIZE=100
```

### 2. Перезапустіть сервер:

```bash
npm run start:dev
```

### 3. Перевірте конфігурацію:

```bash
curl http://localhost:5055/api/notifications/config-status
```

**Очікуваний результат**:
```json
{
  "projectId": "your-project-id-here",
  "hasAccessToken": true,
  "isConfigured": true,
  "status": "configured",
  "message": "Expo Push Notifications are properly configured"
}
```

## 📱 React Native Налаштування

### 1. Встановіть залежності:

```bash
npx expo install expo-notifications
```

### 2. Отримайте push token:

```typescript
import * as Notifications from 'expo-notifications';

const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-project-id-here' // Той самий ID що в .env
});

console.log('Expo Push Token:', token.data);
```

### 3. Зареєструйте пристрій:

```typescript
await api.post('/notifications/device/register-mobile', {
  participantId: 'user_123',
  projectUniqueId: 'PROJ-001',
  token: token.data, // Expo Push Token
  platform: Platform.OS,
  deviceId: DeviceInfo.getUniqueId(),
  appVersion: DeviceInfo.getVersion(),
  locale: Localization.locale,
});
```

## 🔍 Перевірка роботи

### 1. Тест push-повідомлення:

```bash
curl -X POST http://localhost:5055/api/notifications/test-expo-push \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "test_user_123",
    "projectUniqueId": "TEST-001",
    "message": "Hello from Expo Push!"
  }'
```

### 2. Перевірка статистики:

```bash
curl http://localhost:5055/api/notifications/stats
```

## ⚠️ Поширені проблеми

### 1. **"EXPO_PUBLIC_PROJECT_ID not configured"**
**Рішення**: Додайте `EXPO_PUBLIC_PROJECT_ID` в `.env` файл

### 2. **"Invalid Expo push token"**
**Рішення**: Переконайтеся, що токен починається з `ExponentPushToken[...]` або `ExpoPushToken[...]`

### 3. **Push-повідомлення не доставляються**
**Перевірте**:
- Правильність Project ID
- Валідність push токена
- Наявність інтернет-з'єднання
- Логи сервера

## 🔒 Безпека

### 1. **Не комітьте .env файл**:
```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. **Використовуйте різні токени для різних середовищ**:
```bash
# .env.development
EXPO_PUBLIC_PROJECT_ID="dev-project-id"

# .env.production  
EXPO_PUBLIC_PROJECT_ID="prod-project-id"
```

### 3. **Обмежте доступ до access token**:
- Використовуйте read-only токени
- Регулярно оновлюйте токени
- Моніторте використання

## 📊 Моніторинг

### 1. **Логи сервера**:
```typescript
// Успішна ініціалізація
✅ Expo Push Provider initialized with access token
✅ Expo Project ID: your-project-id

// Попередження
⚠️ Expo Push Provider initialized without access token (public project)
⚠️ EXPO_PUBLIC_PROJECT_ID not configured
```

### 2. **API endpoints для моніторингу**:
- `GET /api/notifications/config-status` - статус конфігурації
- `GET /api/notifications/stats` - статистика
- `POST /api/notifications/test-expo-push` - тестування

## 🚀 Продакшен налаштування

### 1. **Environment змінні**:
```bash
# production.env
EXPO_PUBLIC_PROJECT_ID="your-production-project-id"
EXPO_ACCESS_TOKEN="your-production-access-token"
NODE_ENV=production
```

### 2. **Docker**:
```dockerfile
# Dockerfile
ENV EXPO_PUBLIC_PROJECT_ID=your-project-id
ENV EXPO_ACCESS_TOKEN=your-access-token
```

### 3. **Kubernetes**:
```yaml
# deployment.yaml
env:
- name: EXPO_PUBLIC_PROJECT_ID
  valueFrom:
    secretKeyRef:
      name: expo-secrets
      key: project-id
- name: EXPO_ACCESS_TOKEN
  valueFrom:
    secretKeyRef:
      name: expo-secrets
      key: access-token
```

## 📚 Корисні посилання

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo Project Management](https://docs.expo.dev/accounts/programmatic-access/)
- [React Native Notifications](https://github.com/wix/react-native-notifications)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)

---

**Примітка**: Після налаштування всіх змінних перезапустіть сервер та перевірте конфігурацію через API endpoint.
