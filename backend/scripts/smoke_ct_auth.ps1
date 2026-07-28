# Smoke CT-auth (OBS-07)
# Usage: .\scripts\smoke_ct_auth.ps1 [-BaseUrl http://localhost:8080]

param(
  [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Continue"
Write-Host "BE=$BaseUrl"

$h = Invoke-WebRequest "$BaseUrl/actuator/health" -UseBasicParsing
$lab = $h.Headers["X-Prisma-Lab"]
if ($lab -ne "true") {
  Write-Warning "X-Prisma-Lab missing (set PRISMA_LAB_MARK=true)"
} else {
  Write-Host "OK header X-Prisma-Lab=$lab"
}
Write-Host "health=$($h.StatusCode)"

try {
  $r = Invoke-WebRequest "$BaseUrl/api/v1/self-service/identify" -Method POST `
    -ContentType "application/json" `
    -Body '{"documento":"12345678901","birthDate":"1990-01-01","lastDigits":"01"}' `
    -UseBasicParsing
  Write-Host "identify=$($r.StatusCode) lab=$($r.Headers['X-Prisma-Lab'])"
} catch {
  if ($_.Exception.Response) {
    Write-Host "identify=$([int]$_.Exception.Response.StatusCode) (route alive)"
  } else {
    Write-Host "identify_ERR=$($_.Exception.Message)"
  }
}

try {
  $g = Invoke-WebRequest "$BaseUrl/api/v1/portfolio/graph" -UseBasicParsing
  Write-Host "portfolio_graph=$($g.StatusCode)"
} catch {
  if ($_.Exception.Response) {
    Write-Host "portfolio_graph=$([int]$_.Exception.Response.StatusCode)"
  } else {
    Write-Host "portfolio_graph_ERR=$($_.Exception.Message)"
  }
}

$cid = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
try {
  Invoke-WebRequest "$BaseUrl/api/v1/auth/liveness/session" -Method POST `
    -ContentType "application/json" `
    -Body "{`"customer_id`":`"$cid`"}" -UseBasicParsing | Out-Null
  Write-Host "liveness_unexpected_200"
} catch {
  if ($_.Exception.Response) {
    Write-Host "liveness_no_consent=$([int]$_.Exception.Response.StatusCode) (expect 412)"
  } else {
    Write-Host "liveness_ERR=$($_.Exception.Message)"
  }
}

Write-Host "SMOKE_CT_AUTH_DONE"
Write-Host "With OIDC on: GET /api/v1/identity/candidates without Bearer must be 401"
