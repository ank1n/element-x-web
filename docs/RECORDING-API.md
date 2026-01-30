# Recording API Documentation

API для управления записью звонков через LiveKit Egress.

**Base URL:** `https://api.market.implica.ru/api/recording`

---

## Endpoints

### POST /start

Начать запись звонка для комнаты.

**Request:**
```json
{
  "roomName": "!room:example.com"
}
```

**Response (200 OK):**
```json
{
  "egressId": "egress_abc123",
  "status": "started"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid room name"
}
```

---

### POST /stop

Остановить активную запись.

**Request:**
```json
{
  "egressId": "egress_abc123"
}
```

**Response (200 OK):**
```json
{
  "status": "stopping",
  "message": "Recording will be processed"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Recording not found"
}
```

---

### GET /status

Получить статус записи.

**Query Parameters:**
- `egressId` (required): ID записи

**Example:**
```
GET /status?egressId=egress_abc123
```

**Response (200 OK):**
```json
{
  "egressId": "egress_abc123",
  "status": 1,
  "downloadUrl": "https://example.com/recordings/abc123.mp3",
  "duration": 125,
  "startedAt": "2026-01-30T10:00:00Z",
  "endedAt": "2026-01-30T10:02:05Z"
}
```

**Status codes:**
- `0` - Processing (запись обрабатывается)
- `1` - Ready (запись готова к скачиванию)
- `2` - Failed (ошибка при обработке)

**Response (404 Not Found):**
```json
{
  "error": "Recording not found"
}
```

---

### GET /list

Получить список записей для комнаты.

**Query Parameters:**
- `roomName` (required): ID комнаты Matrix

**Example:**
```
GET /list?roomName=!room:example.com
```

**Response (200 OK):**
```json
{
  "recordings": [
    {
      "egressId": "egress_abc123",
      "roomName": "!room:example.com",
      "status": 1,
      "downloadUrl": "https://example.com/recordings/abc123.mp3",
      "duration": 125,
      "startedAt": "2026-01-30T10:00:00Z",
      "endedAt": "2026-01-30T10:02:05Z"
    },
    {
      "egressId": "egress_def456",
      "roomName": "!room:example.com",
      "status": 0,
      "startedAt": "2026-01-30T11:00:00Z"
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing roomName parameter"
}
```

---

### POST /delete

Удалить запись.

**Request:**
```json
{
  "egressId": "egress_abc123"
}
```

**Response (200 OK):**
```json
{
  "message": "Recording deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Recording not found"
}
```

---

## Authentication

API использует аутентификацию через Matrix access token.

**Header:**
```
Authorization: Bearer <matrix_access_token>
```

**Example:**
```bash
curl -X POST https://api.market.implica.ru/api/recording/start \
  -H "Authorization: Bearer syt_example_token" \
  -H "Content-Type: application/json" \
  -d '{"roomName": "!room:example.com"}'
```

---

## Error Responses

Все ошибки возвращаются в формате:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `INVALID_REQUEST` - Невалидный запрос
- `UNAUTHORIZED` - Не авторизован
- `NOT_FOUND` - Ресурс не найден
- `INTERNAL_ERROR` - Внутренняя ошибка сервера
- `RECORDING_FAILED` - Ошибка при записи

---

## Rate Limiting

API имеет лимиты:
- 10 запросов в минуту на /start
- 60 запросов в минуту на /status и /list
- 5 запросов в минуту на /delete

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1706610000
```

---

## WebSocket Events (Future)

Планируется поддержка WebSocket для real-time обновлений статуса:

```javascript
const ws = new WebSocket('wss://api.market.implica.ru/api/recording/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Recording status:', data.status);
};
```

**Event format:**
```json
{
  "type": "status_update",
  "egressId": "egress_abc123",
  "status": 1,
  "downloadUrl": "https://example.com/recordings/abc123.mp3"
}
```

---

## LiveKit Egress Integration

Backend использует LiveKit Egress для записи звонков:

**LiveKit Egress Flow:**
1. Frontend → API: POST /start
2. API → LiveKit: CreateEgressRequest
3. LiveKit → Storage: Save recording
4. Storage → CDN: Publish recording
5. API → Frontend: downloadUrl

**Configuration:**
```yaml
livekit:
  url: wss://livekit.implica.ru
  api_key: ${LIVEKIT_API_KEY}
  api_secret: ${LIVEKIT_API_SECRET}

egress:
  output_path: /recordings/{room_name}/{egress_id}
  file_format: mp3
  audio_codec: opus
  bitrate: 128000
```

---

## Examples

### Start Recording

```javascript
const response = await fetch('https://api.market.implica.ru/api/recording/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roomName: '!abc:matrix.org'
  })
});

const data = await response.json();
console.log('Egress ID:', data.egressId);
```

### Poll Status

```javascript
async function pollStatus(egressId) {
  const response = await fetch(
    `https://api.market.implica.ru/api/recording/status?egressId=${egressId}`,
    {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    }
  );

  const data = await response.json();

  if (data.status === 1) {
    console.log('Recording ready:', data.downloadUrl);
    return data;
  } else if (data.status === 2) {
    console.error('Recording failed:', data.error);
    throw new Error(data.error);
  }

  // Still processing, poll again
  await new Promise(resolve => setTimeout(resolve, 1000));
  return pollStatus(egressId);
}
```

### List Recordings

```javascript
const response = await fetch(
  'https://api.market.implica.ru/api/recording/list?roomName=!abc:matrix.org',
  {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  }
);

const data = await response.json();
console.log('Found recordings:', data.recordings.length);
data.recordings.forEach(rec => {
  console.log(`- ${rec.egressId}: ${rec.status === 1 ? 'Ready' : 'Processing'}`);
});
```

---

## Related Files

- Frontend: `src/services/RecordingService.ts`
- Backend: `/root/ai-container-hardening/src/api/recording.py` (planned)
- Config: `src/config/appConfig.ts`

---

**Last Updated:** 2026-01-30
**API Version:** 1.0
**Maintainer:** Element X Web Team
