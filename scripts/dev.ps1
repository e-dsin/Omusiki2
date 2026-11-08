# scripts/dev.ps1 — démarre le back-end simulé et le front Ô musiki (Windows)
#   powershell -ExecutionPolicy Bypass -File scripts/dev.ps1            # mode api (back + front)
#   powershell -ExecutionPolicy Bypass -File scripts/dev.ps1 -Mode demo # front seul, tout simulé dans le navigateur
#   ... -ResetDb                                                       # repart d'une base vide
# Le back-end s'ouvre dans une seconde fenêtre PowerShell (fermez-la pour l'arrêter).

param(
  [ValidateSet('api', 'demo')][string]$Mode = 'api',
  [switch]$ResetDb,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$venvPython = Join-Path $Backend '.venv\Scripts\python.exe'

if ($Mode -eq 'api') {
  if (-not (Test-Path $venvPython)) {
    Write-Host 'Environnement Python absent : lancez d''abord scripts/setup.ps1' -ForegroundColor Red
    exit 1
  }
  if ($ResetDb) {
    $db = Join-Path $Backend 'data\omusiki.db'
    if (Test-Path $db) { Remove-Item $db; Write-Host 'Base locale effacée.' }
  }
  $listening = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
  if ($listening) {
    Write-Host 'Un serveur écoute déjà sur le port 3001 : il est réutilisé.' -ForegroundColor Yellow
  } else {
    $cmd = "Set-Location '$Backend'; `$host.UI.RawUI.WindowTitle = 'Ô musiki — back-end (3001)'; & '$venvPython' -m uvicorn app.main:app --host 127.0.0.1 --port 3001 --reload"
    Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', $cmd | Out-Null
    Write-Host 'Back-end lancé dans une nouvelle fenêtre : http://127.0.0.1:3001/docs'
    # Attente de disponibilité (30 s maximum)
    for ($i = 0; $i -lt 60; $i++) {
      try { Invoke-RestMethod http://127.0.0.1:3001/api/health -TimeoutSec 1 | Out-Null; break } catch { Start-Sleep -Milliseconds 500 }
    }
  }
}

Set-Location $Root
if (-not $NoBrowser) {
  Start-Job -ScriptBlock { Start-Sleep -Seconds 4; Start-Process 'http://127.0.0.1:3000' } | Out-Null
}
if ($Mode -eq 'api') { npm run dev:api } else { npm run dev }
