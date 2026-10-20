# Publish the site: run from this folder with  .\deploy.ps1 "what changed"
param([string]$Message = "Update Fret Grind")
Set-Location $PSScriptRoot
if (-not (Test-Path .git)) {
  git init -b main
  git remote add origin https://github.com/TheCosmicKitchen/FretGrind.git
  git fetch origin
  git reset origin/main   # adopt the remote history, keep these files
}
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) { Write-Host "Nothing to commit."; exit }
git commit -m $Message
git push -u origin main
