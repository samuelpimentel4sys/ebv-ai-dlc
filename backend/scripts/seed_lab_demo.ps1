# Aplica massa lab no Postgres do Compose prisma
# Uso: .\scripts\seed_lab_demo.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sql = Join-Path $PSScriptRoot 'seed_lab_demo.sql'

if (-not (Test-Path $sql)) { throw "SQL não encontrado: $sql" }

$pg = docker ps --filter name=prisma-postgres --format "{{.Names}}" | Select-Object -First 1
if (-not $pg) { throw "Container prisma-postgres não está up. Rode: docker compose up -d postgres" }

Write-Host "Aplicando seed em $pg ..."
Get-Content -Raw $sql | docker exec -i $pg psql -U prisma -d prisma -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw "Seed falhou" }

Write-Host ""
Write-Host "OK. Personas demo:"
Write-Host "  CPF 12345678901  score ~712  (self-service: birthDate 1990-01-01 lastDigits 8901)"
Write-Host "  CPF 98765432100  score ~548"
Write-Host "  CPF 11144477735  score ~801"
Write-Host "  Portfolio FE: aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
Write-Host "  Contestações: DSP-2026-0001001..1003"
Write-Host "  Decisões: d1000000-0000-4000-8000-000000000001..003"
Write-Host "  Operador platform: reviews / subject-requests / audit / policy author=platform"
Write-Host ""
Write-Host "Login demo: platform / prisma  (ou steward / prisma)"
