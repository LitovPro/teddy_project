# 360dialog WhatsApp Business API Setup

## Конфигурация

### 1. Переменные окружения

Добавьте в ваш `.env` файл:

```env
# 360dialog WhatsApp Business API
DIALOG360_API_KEY=V0Hk6F0fFSfTlEYvhQxjNfzMAK
DIALOG360_BASE_URL=https://waba-v2.360dialog.io
DIALOG360_WEBHOOK_URL=https://your-domain.com/api/webhooks/whatsapp
```

### 2. Настройка Webhook

Для настройки webhook в 360dialog выполните следующий запрос:

```bash
curl -X POST https://waba-v2.360dialog.io/v1/configs/webhook \
  -H "Content-Type: application/json" \
  -H "D360-API-KEY: V0Hk6F0fFSfTlEYvhQxjNfzMAK" \
  -d '{
    "url": "https://your-domain.com/api/webhooks/whatsapp"
  }'
```

**Важно:**
- URL webhook не должен содержать символы подчеркивания (`_`)
- URL webhook не должен содержать порт (например, `:3000`)
- Используйте HTTPS для production

### 3. Проверка работы

После настройки webhook отправьте тестовое сообщение на ваш WhatsApp номер. Бот должен автоматически обработать сообщение и ответить.

## API Endpoints

### Отправка текстового сообщения

```typescript
POST https://waba-v2.360dialog.io/messages
Headers:
  Content-Type: application/json
  D360-API-KEY: V0Hk6F0fFSfTlEYvhQxjNfzMAK
Body:
{
  "recipient_type": "individual",
  "to": "351912345678",
  "type": "text",
  "text": {
    "body": "Hello, this is a test message!"
  }
}
```

### Отправка шаблона

```typescript
POST https://waba-v2.360dialog.io/messages
Headers:
  Content-Type: application/json
  D360-API-KEY: V0Hk6F0fFSfTlEYvhQxjNfzMAK
Body:
{
  "recipient_type": "individual",
  "to": "351912345678",
  "type": "template",
  "template": {
    "name": "welcome_en",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "TF-000123"
          }
        ]
      }
    ]
  }
}
```

### Отправка изображения

```typescript
POST https://waba-v2.360dialog.io/messages
Headers:
  Content-Type: application/json
  D360-API-KEY: V0Hk6F0fFSfTlEYvhQxjNfzMAK
Body:
{
  "recipient_type": "individual",
  "to": "351912345678",
  "type": "image",
  "image": {
    "link": "https://example.com/image.png",
    "caption": "Your loyalty card"
  }
}
```

## Webhook Format

360dialog отправляет webhooks в следующем формате:

```json
{
  "messages": [
    {
      "from": "351912345678",
      "id": "wamid.xxx",
      "timestamp": "1234567890",
      "type": "text",
      "text": {
        "body": "Hello"
      }
    }
  ]
}
```

## Документация

Полная документация 360dialog API доступна по адресу:
https://docs.360dialog.com/

