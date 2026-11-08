# scripts/setup.ps1 — installation du poste de développement Ô musiki (Windows, PowerShell 5.1 ou 7)
# Lancement depuis la racine du projet :
#   powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
# ou dans VS Code : Terminal > Exécuter une tâche… > « Installation (première fois) »
#
# Options :
#   -SkipBrowsers   ne télécharge pas le navigateur Chromium des tests de bout en bout
#   -Reinstall      supprime et recrée l'environnement Python backend\.venv

param(
  [switch]$SkipBrowsers,
  [switch]$Reinstall
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Magenta }
function Fail($text) { Write-Host "ERREUR : $text" -ForegroundColor Red; exit 1 }

# --- 1. Python 3.11 à 3.13 -------------------------------------------------
Step 'Vérification de Python'
# Lanceur « py » (installateur python.org) en priorité, sinon « python »
$python = $null
if (Get-Command py -ErrorAction SilentlyContinue) { $python = @('py', '-3') }
elseif (Get-Command python -ErrorAction SilentlyContinue) { $python = @('python') }
function Invoke-Python {
  $exe = $python[0]
  $prefix = @($python | Select-Object -Skip 1)
  & $exe @prefix @args
}
$version = $null
if ($python) {
  try { $version = Invoke-Python -c 'import sys; print(sys.version_info[0], sys.version_info[1], sep=chr(46))' } catch { $version = $null }
}
if (-not $version) {
  Fail 'Python introuvable. Installez Python 3.12 depuis https://www.python.org/downloads/ (cocher « Add python.exe to PATH »), puis relancez.'
}
$major, $minor = "$version".Trim().Split('.') | ForEach-Object { [int]$_ }
if ($major -ne 3 -or $minor -lt 11) { Fail "Python $version détecté : la version 3.11 ou supérieure est requise." }
Write-Host "Python $version ($($python -join ' '))"

# --- 2. Node.js 20.19+ (exigé par Vite 7) ------------------------------------
Step 'Vérification de Node.js'
try { $nodeVersion = (& node --version).TrimStart('v') } catch { $nodeVersion = $null }
if (-not $nodeVersion) { Fail 'Node.js introuvable. Installez la version LTS depuis https://nodejs.org/ puis relancez.' }
$nv = $nodeVersion.Split('.') | ForEach-Object { [int]$_ }
if ($nv[0] -lt 20 -or ($nv[0] -eq 20 -and $nv[1] -lt 19)) { Fail "Node $nodeVersion détecté : la version 20.19 ou supérieure est requise." }
Write-Host "Node $nodeVersion"

# --- 3. Environnement Python du back-end -----------------------------------
Step 'Environnement Python (backend\.venv)'
$venv = Join-Path $Root 'backend\.venv'
if ($Reinstall -and (Test-Path $venv)) { Remove-Item -Recurse -Force $venv }
if (-not (Test-Path (Join-Path $venv 'Scripts\python.exe'))) {
  Invoke-Python -m venv $venv
  if ($LASTEXITCODE -ne 0) { Fail 'Création de l''environnement Python impossible.' }
}
$venvPython = Join-Path $venv 'Scripts\python.exe'
& $venvPython -m pip install --upgrade pip --quiet
& $venvPython -m pip install -r (Join-Path $Root 'backend\requirements.txt')
if ($LASTEXITCODE -ne 0) { Fail 'Installation des dépendances Python impossible.' }

# --- 4. Dépendances du front ------------------------------------------------
Step 'Dépendances du front (npm install)'
npm install
if ($LASTEXITCODE -ne 0) { Fail 'npm install a échoué.' }

# --- 5. Navigateur des tests de bout en bout --------------------------------
if (-not $SkipBrowsers) {
  Step 'Navigateur Chromium pour les tests Playwright'
  npx playwright install chromium
  if ($LASTEXITCODE -ne 0) { Write-Host 'Téléchargement impossible : relancez plus tard avec « npx playwright install chromium ».' -ForegroundColor Yellow }
}

# --- 6. Vérification rapide -------------------------------------------------
Step 'Tests du back-end (pytest)'
Push-Location (Join-Path $Root 'backend')
& $venvPython -m pytest
$testsOk = $LASTEXITCODE -eq 0
Pop-Location
if (-not $testsOk) { Fail 'Des tests du back-end échouent : voir ci-dessus.' }

Write-Host "`nInstallation terminée." -ForegroundColor Green
Write-Host @'

Pour démarrer :
  - VS Code : Ctrl+Maj+B (« Tout démarrer »), puis ouvrir http://127.0.0.1:3000
  - ou      : powershell -ExecutionPolicy Bypass -File scripts/dev.ps1

Documentation de l'API simulée : http://127.0.0.1:3001/docs
'@
