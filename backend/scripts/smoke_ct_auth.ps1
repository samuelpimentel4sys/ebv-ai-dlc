# Smoke CT-auth (OBS-07)

Lab (`OIDC_ENABLED=false`): valida header lab + rotas públicas.  
Com OIDC on: validar 401 sem token (rodar com Bearer omitido).

```powershell
# Uso:
#   cd Prisma/backend
#   .\scripts\smoke_ct_auth.ps1
#   .\scripts\smoke_ct_auth.ps1 -BaseUrl http://localhost:8080

param(
  [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
Write-Host "BE=$BaseUrl"

# Health
$h = Invoke-WebRequest "$BaseUrl/actuator/health" -UseBasicParsing
if ($h.Headers["X-Prisma-Lab"] -ne "true") {
  Write-Warning "X-Prisma-Lab ausente (prisma.lab.mark-responses=false?)"
} else {
  Write-Host "OK header X-Prisma-Lab"
}
Write-Host "health=$($h.StatusCode)"

# Self-service identify (público) — shape mínimo
try {
  $r = Invoke-WebRequest "$BaseUrl/api/v1/self-service/identify" -Method POST `
    -ContentType "application/json" `
    -Body '{"documento":"12345678901","birthDate":"1990-01-01","lastDigits":"01"}' `
    -UseBasicParsing
  Write-Host "identify=$($r.StatusCode) lab=$($r.Headers['X-Prisma-Lab'])"
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  Write-Host "identify=$code (pode ser 422 com massa — rota viva)"
}

# Portfolio graph (lab aberto se OIDC off)
try {
  $g = Invoke-WebRequest "$BaseUrl/api/v1/portfolio/graph" -UseBasicParsing
  Write-Host "portfolio_graph=$($g.StatusCode)"
} catch {
  Write-Host "portfolio_graph=$([int]$_.Exception.Response.StatusCode)"
}

# Liveness sem consent → 412
$cid = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
try {
  Invoke-WebRequest "$BaseUrl/api/v1/auth/liveness/session" -Method POST `
    -ContentType "application/json" `
    -Body "{`"customer_id`":`"$cid`"}" -UseBasicParsing | Out-Null
  Write-Host "liveness_unexpected_200"
} catch {
  Write-Host "liveness_no_consent=$([int]$_.Exception.Response.StatusCode) (esp. 412)"
}

Write-Host "SMOKE_CT_AUTH_DONE"
Write-Host "Com OIDC on: sem Bearer em /api/v1/identity/candidates deve ser 401."
