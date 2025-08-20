# 🚀 Expo Push Notifications Guide

## 📱 Огляд

Система push-повідомлень була мігрована з Firebase Cloud Messaging (FCM) на **Expo Push Notifications** для кращої інтеграції з React Native додатками.

## ✨ Переваги Expo Push

- **Простота**: Не потрібно налаштовувати FCM/APNs сертифікати
- **Крос-платформенність**: Один API для iOS, Android та Web
- **Автоматичне управління**: Expo автоматично обробляє токени та доставку
- **Безкоштовно**: До 100 push-повідомлень на секунду
- **Надійність**: Автоматичні retry та fallback механізми

## 🏗️ Архітектура

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API    │    │   Expo Servers  │
│                 │    │                  │    │                 │
│ 1. Get Expo     │───▶│ 2. Store Token  │───▶│ 3. Send Push    │
│    Push Token   │    │ 3. Send Push     │    │    Notification │
│                 │    │    Request       │    │                 │
│ 4. Receive      │◀───│                  │    │                 │
│    Notification │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Налаштування

### 1. Встановлення залежностей

```bash
npm install expo-server-sdk
```

### 2. Конфігурація модуля

```typescript
// notifications.module.ts
@Module({
  providers: [
    { provide: PushProviderPort, useClass: ExpoPushProvider },
    // ...
  ],
})
export class NotificationsModule {}
```

## 📋 API Endpoints

### Реєстрація пристрою

```http
POST /api/notifications/device/register-mobile
Content-Type: application/json

{
  "participantId": "mobile_user_123",
  "projectUniqueId": "DEMO-001",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "deviceId": "iPhone14Pro-abc123",
  "appVersion": "1.2.3",
  "locale": "en-US",
  "expoAppId": "com.yourcompany.yourapp"
}
```

### Тестування push-повідомлення

```http
POST /api/notifications/test-expo-push
Content-Type: application/json

{
  "participantId": "PROJ-248F685D_dev_af_uid_12345",
  "projectUniqueId": "PROJ-248F685D",
  "message": "This is a test Expo push notification"
}
```

### Статистика

```http
GET /api/notifications/stats
```

## 🔑 Expo Push Token Формат

Expo push токени мають специфічний формат:

- **ExponentPushToken[...]** - для Expo Go додатків
- **ExpoPushToken[...]** - для standalone додатків

### Валідація токена

```typescript
import { Expo } from 'expo-server-sdk';

const isValid = Expo.isExpoPushToken(token);
```

## 📨 Відправка Push-повідомлень

### 1. Через PushNotificationsService

```typescript
@Injectable()
export class ChatService {
  constructor(private pushService: PushNotificationsService) {}

  async sendMessage(message: CreateMessageDto) {
    // ... логіка збереження повідомлення

    // Відправляємо push-повідомлення
    await this.pushService.sendChatMessagePush({
      recipientUserId: message.recipientId,
      chatId: message.chatId,
      messageId: savedMessage.id,
      projectId: message.projectId,
      preview: message.content.substring(0, 100),
      senderName: sender.name,
      senderId: sender.id,
    });
  }
}
```

### 2. Пряма відправка

```typescript
await this.pushService.sendToUser({
  userId: 123,
  title: 'New Message',
  body: 'You have a new message in chat',
  data: {
    type: 'chat_message',
    chatId: '456',
    deeplink: 'app://chat/456'
  }
});
```

## 🎯 Типи Push-повідомлень

### 1. Chat Messages

```typescript
{
  type: 'chat_message',
  chatId: string,
  messageId: string,
  projectId: string,
  senderId: string,
  deeplink: 'app://chat/{chatId}',
  _displayInForeground: 'true',
  sound: 'default',
  priority: 'high'
}
```

### 2. Test Notifications

```typescript
{
  type: 'test',
  timestamp: string
}
```

### 3. Custom Data

```typescript
{
  customField: 'value',
  action: 'open_screen',
  metadata: JSON.stringify({ key: 'value' })
}
```

## 📊 Статистика та Моніторинг

### Метрики

- Загальна кількість зареєстрованих пристроїв
- Кількість активних Expo токенів
- Розподіл по платформам (iOS/Android/Web)
- Успішність доставки

### Логування

```typescript
// Успішна доставка
✅ Push notification sent successfully to token: ExponentPushToken[abc...

// Невдала доставка
❌ Failed to send push notification to token: ExponentPushToken[abc...

// Недійсний токен
⚠️ Found 2 invalid Expo push tokens
```

## 🚨 Обробка Помилок

### 1. Недійсні токени

```typescript
// Автоматично деактивуються
if (result.invalid.length) {
  await Promise.all(result.invalid.map(token => 
    this.repo.deactivateToken(token)
  ));
}
```

### 2. Retry механізм

Expo автоматично обробляє:
- Тимчасові помилки мережі
- Rate limiting
- Invalid tokens

### 3. Fallback стратегії

```typescript
try {
  const result = await this.provider.sendToTokens(params);
  // Обробка результату
} catch (error) {
  this.logger.error(`Failed to send push notifications: ${error.message}`);
  // Fallback логіка або черга для повторної спроби
}
```

## 🔄 Міграція з FCM

### Що змінилося

1. **Провайдер**: `FcmProvider` → `ExpoPushProvider`
2. **Токени**: FCM токени → Expo Push токени
3. **API**: Firebase Admin SDK → Expo Server SDK
4. **Конфігурація**: Сервісні ключі → Не потрібні

### Що залишилося

1. **Структура API**: Endpoints залишаються такими ж
2. **Логіка бізнесу**: Сервіси не змінилися
3. **Схема бази даних**: Структура залишається такою ж

## 📱 React Native Інтеграція

### 1. Отримання Expo Push Token

```typescript
import * as Notifications from 'expo-notifications';

const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id'
});
```

### 2. Реєстрація на бекенді

```typescript
await api.post('/notifications/device/register-mobile', {
  participantId: 'user_123',
  projectUniqueId: 'PROJ-001',
  token: token.data,
  platform: Platform.OS,
  deviceId: DeviceInfo.getUniqueId(),
  appVersion: DeviceInfo.getVersion(),
  locale: Localization.locale,
});
```

### 3. Обробка вхідних повідомлень

```typescript
Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification received:', notification);
});

Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  if (data.deeplink) {
    // Навігація по deeplink
    router.push(data.deeplink);
  }
});
```

## 🧪 Тестування

### 1. Тестовий endpoint

```bash
curl -X POST http://localhost:5055/api/notifications/test-expo-push \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "test_user_123",
    "projectUniqueId": "TEST-001",
    "message": "Hello from Expo Push!"
  }'
```

### 2. Перевірка статистики

```bash
curl http://localhost:5055/api/notifications/stats
```

### 3. Тестування з Expo Go

1. Встановіть Expo Go на телефон
2. Зареєструйте тестовий токен
3. Відправте тестове повідомлення
4. Перевірте доставку

## 📈 Продуктивність

### Обмеження

- **Rate Limit**: 100 push-повідомлень на секунду
- **Batch Size**: Рекомендується максимум 100 токенів за раз
- **Token Validation**: Автоматична валідація формату

### Оптимізація

```typescript
// Розбиття на чанки
const chunks = this.expo.chunkPushNotifications(messages);

for (const chunk of chunks) {
  const tickets = await this.expo.sendPushNotificationsAsync(chunk);
  // Обробка результатів
}
```

## 🔒 Безпека

### 1. Валідація токенів

```typescript
// Перевірка формату
if (!Expo.isExpoPushToken(token)) {
  throw new Error('Invalid Expo push token');
}
```

### 2. Авторизація

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Post('admin/test')
async adminTest() {
  // Тільки адміністратори можуть тестувати
}
```

### 3. Санітизація даних

```typescript
// Валідація через DTO
export class RegisterMobileDeviceDto {
  @IsString()
  @Matches(/^(ExponentPushToken|ExpoPushToken)\[.+\]$/)
  token!: string;
}
```

## 🚀 Майбутні Покращення

### 1. Розширена аналітика

- Детальна статистика доставки
- A/B тестування повідомлень
- Сегментація користувачів

### 2. Розумні сповіщення

- Персоналізація на основі поведінки
- Оптимальний час відправки
- Frequency capping

### 3. Web Push підтримка

- Push API для веб-додатків
- Service Worker інтеграція
- Крос-браузерна сумісність

## 📚 Корисні Посилання

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- [React Native Notifications](https://github.com/wix/react-native-notifications)
- [Push Notification Best Practices](https://developer.apple.com/design/human-interface-guidelines/ios/user-interface/notifications/)

---

**Примітка**: Ця система замінила Firebase Cloud Messaging на Expo Push Notifications для кращої інтеграції з React Native додатками.
