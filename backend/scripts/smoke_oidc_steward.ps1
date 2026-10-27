# Smoke OIDC lab — steward via proxy FE :5173 (mesmo path do browser).
# Uso: .\scripts\smoke_oidc_steward.ps1
$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:5173'

$tokenBody = 'client_id=prisma-lab&grant_type=password&username=steward&password=prisma&scope=openid+profile'
$tok = (Invoke-RestMethod -Method Post -Uri "$base/realms/prisma/protocol/openid-connect/token" `
    -Body $tokenBody -ContentType 'application/x-www-form-urlencoded').access_token

$payload = $tok.Split('.')[1].Replace('-', '+').Replace('_', '/')
while ($payload.Length % 4) { $payload += '=' }
$claims = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json
$roles = @($claims.realm_access.roles)
Write-Host "user=$($claims.preferred_username) roles=$($roles -join ',')"
if ($roles -notcontains 'PLATFORM') {
    throw 'TOKEN sem PLATFORM — relogue / reimporte realm'
}

$h = @{ Authorization = "Bearer $tok"; 'Content-Type' = 'application/json' }

function Assert-Http([string]$label, [string]$method, [string]$path, [string]$body, [int[]]$ok) {
    try {
        if ($body) {
            $r = Invoke-WebRequest -Method $method -Uri "$base$path" -Headers $h -Body $body -UseBasicParsing
        } else {
            $r = Invoke-WebRequest -Method $method -Uri "$base$path" -Headers $h -UseBasicParsing
        }
        $code = [int]$r.StatusCode
    } catch {
        $code = [int]$_.Exception.Response.StatusCode
        $errBody = ''
        if ($_.Exception.Response) {
            $errBody = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
        }
        if ($ok -notcontains $code) {
            throw "$label -> $code (esperado $($ok -join '|')) $errBody"
        }
        Write-Host "OK $label -> $code"
        return
    }
    if ($ok -notcontains $code) { throw "$label -> $code (esperado $($ok -join '|'))" }
    Write-Host "OK $label -> $code"
}

Assert-Http 'ingest/sources' 'GET' '/api/v1/ingest/sources' $null @(200)
Assert-Http 'ingest/replay' 'POST' '/api/v1/ingest/replay' `
    '{"sourceId":"lab","windowStart":"2026-07-26T00:00:00.000Z","windowEnd":"2026-07-27T00:00:00.000Z","justification":"Replay solicitado via console Sofia"}' `
    @(200)
Assert-Http 'missions/progress (FE evt-*)' 'POST' `
    '/api/v1/missions/e0000000-0000-4000-8000-000000000001/progress' `
    '{"documento":"12345678901","verifiedEventType":"LAB","verifiedEventId":"evt-1759090000","deltaPct":10}' `
    @(200)
Assert-Http 'score' 'GET' '/api/v1/score/12345678901' $null @(200)

Write-Host 'SMOKE OK'
