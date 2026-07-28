# Rekognition Face Liveness — mock lab

AWS **Face Liveness** (`CreateFaceLivenessSession`) **não** está disponível no LocalStack.

## Controlo em dev

| `LIVENESS_MODE` | Comportamento |
|-----------------|---------------|
| `stub` (default) | Java gera `session_id` UUID — sem container |
| `http` | Chama WireMock (`LIVENESS_MOCK_URL`) |
| `aws` | SDK real (credenciais AWS) — fora lab Docker |

```bash
# na pasta backend/
docker compose -f docker-compose.yml -f docker-compose.liveness.yml up -d rekognition-mock
# .env
LIVENESS_MODE=http
LIVENESS_MOCK_URL=http://localhost:8093
```

FE recebe `session_id` fake; captura real Amplify/Rekognition SDK só com `aws`.
