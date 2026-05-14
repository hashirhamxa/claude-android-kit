#Requires -Version 5.1
# install.ps1 -- Claude Android Kit installer
# Usage: .\install.ps1 [-Profile minimal|core|full] [-WithoutHooks] [-DryRun] [-Force] [-Uninstall]

param(
    [ValidateSet('minimal', 'core', 'full')]
    [string]$Profile = 'core',
    [switch]$WithoutHooks,
    [switch]$DryRun,
    [switch]$Force,
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$KitRoot     = $PSScriptRoot
$VersionFile = Join-Path $KitRoot 'VERSION'
$Version     = if (Test-Path -LiteralPath $VersionFile) { (Get-Content -LiteralPath $VersionFile).Trim() } else { '0.2.0' }
$InstallRoot = Join-Path $HOME '.claude'
$StateFile   = Join-Path $InstallRoot '.cak-install-state.json'

$script:filesCopied  = 0
$script:filesSkipped = 0
$script:filesErrors  = 0
$script:installed    = [System.Collections.Generic.List[string]]::new()

# -- colour helpers ------------------------------------------------------------
function Write-Copy  ([string]$msg) { Write-Host "[COPY]    $msg" -ForegroundColor Green }
function Write-Skip  ([string]$msg) { Write-Host "[SKIP]    $msg" -ForegroundColor Yellow }
function Write-Warn  ([string]$msg) { Write-Host "[WARN]    $msg" -ForegroundColor Yellow }
function Write-Err   ([string]$msg) { Write-Host "[ERROR]   $msg" -ForegroundColor Red }
function Write-Dry ([string]$src, [string]$dest) {
    Write-Host "[DRY RUN] $src -> $dest" -ForegroundColor Green
}

# -- install_file --------------------------------------------------------------
function Install-File ([string]$Source, [string]$Dest) {
    if ($DryRun) {
        Write-Dry $Source $Dest
        $script:filesCopied++
        return
    }

    if ((Test-Path -LiteralPath $Dest) -and (-not $Force)) {
        Write-Skip $Dest
        $script:filesSkipped++
        return
    }

    $destDir = Split-Path -Parent $Dest
    if (-not (Test-Path -LiteralPath $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    try {
        Copy-Item -LiteralPath $Source -Destination $Dest -Force
        Write-Copy $Dest
        $script:installed.Add($Dest)
        $script:filesCopied++
    } catch {
        Write-Err "Failed: $Source -> $Dest -- $_"
        $script:filesErrors++
    }
}

# -- install_tree --------------------------------------------------------------
function Install-Tree ([string]$SrcDir, [string]$DestDir) {
    if (-not (Test-Path -LiteralPath $SrcDir)) { return }
    Get-ChildItem -LiteralPath $SrcDir -Recurse -File |
        Sort-Object FullName |
        ForEach-Object {
            $rel  = $_.FullName.Substring($SrcDir.Length).TrimStart([char]'\', [char]'/')
            $dest = Join-Path $DestDir $rel
            Install-File $_.FullName $dest
        }
}

# -- UNINSTALL -----------------------------------------------------------------
if ($Uninstall) {
    if (-not (Test-Path -LiteralPath $StateFile)) {
        Write-Err "State file not found: $StateFile"
        Write-Host "Cannot safely uninstall without the state file. Remove files manually."
        exit 1
    }

    Write-Host "Reading: $StateFile"
    $state = Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json
    $filesToRemove = $state.files

    foreach ($path in $filesToRemove) {
        if ($DryRun) {
            Write-Host "[DRY RUN] Would remove: $path"
        } elseif (Test-Path -LiteralPath $path) {
            Remove-Item -LiteralPath $path -Force
            Write-Host "Removed: $path"
        } else {
            Write-Host "Already gone: $path"
        }
    }

    if (-not $DryRun) {
        Remove-Item -LiteralPath $StateFile -Force
        Write-Host "Removed state file: $StateFile"
        Write-Host "CAK uninstalled."
    }
    exit 0
}

# -- INSTALL -------------------------------------------------------------------
if ($DryRun) {
    Write-Host "[DRY RUN] Installing CAK (profile: $Profile) -- no files will be written"
} else {
    Write-Host "Installing CAK (profile: $Profile)..."
    if (-not (Test-Path -LiteralPath $InstallRoot)) {
        New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
        Write-Host "Created $InstallRoot"
    }
}
Write-Host ""

# Rules -- all profiles
foreach ($pack in @('common', 'kotlin', 'android', 'kmp')) {
    Install-Tree (Join-Path $KitRoot  "rules\$pack") `
                 (Join-Path $InstallRoot "rules\cak\$pack")
}

# Agents -- all profiles
Install-Tree (Join-Path $KitRoot 'agents') (Join-Path $InstallRoot 'agents')

# Commands + Skills -- core and full
if ($Profile -in @('core', 'full')) {
    Install-Tree (Join-Path $KitRoot 'commands') (Join-Path $InstallRoot 'commands')
    Install-Tree (Join-Path $KitRoot 'skills')   (Join-Path $InstallRoot 'skills')
}

# Hooks + Scripts -- full only (unless -WithoutHooks)
if ($Profile -eq 'full') {
    if ($WithoutHooks) {
        Write-Warn "Skipping hooks/scripts (-WithoutHooks passed)"
    } elseif (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Warn "Node.js not found -- skipping hook and script install."
        Write-Warn "Install Node.js then re-run with -Profile full to add hooks."
    } else {
        Install-File (Join-Path $KitRoot  'hooks\hooks.json') `
                     (Join-Path $InstallRoot 'hooks\hooks.json')
        Install-Tree (Join-Path $KitRoot 'scripts') (Join-Path $InstallRoot 'scripts')
    }
}

# Templates -- never auto-copied; print guidance
Write-Host ""
Write-Host "Templates are not auto-installed. Copy manually when starting a new project:"
Write-Host "  Android  Copy-Item '$KitRoot\templates\CLAUDE.android.template.md' '<project>\CLAUDE.md'"
Write-Host "  KMP      Copy-Item '$KitRoot\templates\CLAUDE.kmm.template.md' '<project>\CLAUDE.md'"

# -- write state file ----------------------------------------------------------
if ((-not $DryRun) -and ($script:filesCopied -gt 0)) {
    $isoDate = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    $state   = [PSCustomObject]@{
        version     = $Version
        profile     = $Profile
        installedAt = $isoDate
        files       = $script:installed.ToArray()
    }
    $state | ConvertTo-Json -Depth 3 -Compress | Set-Content -Path $StateFile -Encoding UTF8
    Write-Host ""
    Write-Host "State saved: $StateFile"
}

# -- summary -------------------------------------------------------------------
Write-Host ""
if ($DryRun) {
    Write-Host "CAK dry run complete (profile: $Profile) -- no files were written"
} else {
    Write-Host "CAK installed (profile: $Profile, $($script:filesCopied) files copied, $($script:filesSkipped) skipped)"
    if ($script:filesErrors -gt 0) {
        Write-Host "$($script:filesErrors) error(s) -- check output above." -ForegroundColor Red
    }
}
