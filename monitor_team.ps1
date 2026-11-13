# ProfitAI Team Progress Monitor
# Created for: Risfiatul (Product Lead)
# Purpose: Daily monitoring of team GitHub activity

param(
    [switch]$Detailed,
    [switch]$ExportReport
)

# Configuration
$repoPath = "d:\aiforbusiness\tes-buku-biru"
$teamMembers = @(
    @{Name="Guntur"; Email="guntur"; Role="Backend"},
    @{Name="Ronal"; Email="ronal"; Role="Frontend-Design"},
    @{Name="Hanif"; Email="hanif"; Role="Frontend-Features"},
    @{Name="Risfiatul"; Email="risfiatul"; Role="Product-Lead"}
)

# Colors
$colorHeader = "Cyan"
$colorSuccess = "Green"
$colorWarning = "Yellow"
$colorError = "Red"
$colorInfo = "Gray"

# Navigate to repository
try {
    Set-Location $repoPath -ErrorAction Stop
} catch {
    Write-Host "❌ Error: Cannot access repository at $repoPath" -ForegroundColor $colorError
    exit 1
}

# Function to draw separator
function Draw-Separator {
    param([int]$Length = 80, [string]$Color = $colorInfo)
    Write-Host ("=" * $Length) -ForegroundColor $Color
}

# Function to check if command exists
function Test-CommandExists {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Header
Clear-Host
Write-Host ""
Draw-Separator -Color $colorHeader
Write-Host "🚀 PROFITAI TEAM PROGRESS MONITOR" -ForegroundColor $colorHeader
Write-Host "📅 $(Get-Date -Format 'dddd, dd MMMM yyyy HH:mm:ss')" -ForegroundColor $colorInfo
Draw-Separator -Color $colorHeader
Write-Host ""

# Fetch latest from remote
Write-Host "🔄 Fetching latest from GitHub..." -ForegroundColor $colorInfo
try {
    git fetch origin 2>$null
    Write-Host "✅ Fetch successful" -ForegroundColor $colorSuccess
} catch {
    Write-Host "⚠️  Warning: Could not fetch from remote" -ForegroundColor $colorWarning
}
Write-Host ""

# Check branch status
Write-Host "🌿 CURRENT BRANCH STATUS" -ForegroundColor $colorHeader
Write-Host "-" * 80
$currentBranch = git branch --show-current
$remoteBranch = "origin/$currentBranch"
Write-Host "  Current branch: " -NoNewline
Write-Host "$currentBranch" -ForegroundColor $colorSuccess

# Check if ahead/behind
$ahead = (git rev-list "$remoteBranch..HEAD" 2>$null | Measure-Object).Count
$behind = (git rev-list "HEAD..$remoteBranch" 2>$null | Measure-Object).Count

if ($ahead -gt 0) {
    Write-Host "  ↑ Ahead by $ahead commits" -ForegroundColor $colorWarning
}
if ($behind -gt 0) {
    Write-Host "  ↓ Behind by $behind commits" -ForegroundColor $colorWarning
}
if ($ahead -eq 0 -and $behind -eq 0) {
    Write-Host "  ✅ Up to date with remote" -ForegroundColor $colorSuccess
}
Write-Host ""

# Team Activity Report
Write-Host "👥 TEAM ACTIVITY (Last 24 Hours)" -ForegroundColor $colorHeader
Draw-Separator

foreach ($member in $teamMembers) {
    Write-Host ""
    Write-Host "👤 $($member.Name) [$($member.Role)]" -ForegroundColor $colorWarning
    Write-Host "   " + ("-" * 75)
    
    # Get commits by author email pattern
    $commits = git log --all --since="24 hours ago" --author="$($member.Email)" --pretty=format:"%h|%ar|%s" 2>$null
    
    if ($commits) {
        $commitArray = $commits -split "`n"
        $commitCount = $commitArray.Count
        
        Write-Host "   ✅ $commitCount commits in last 24 hours" -ForegroundColor $colorSuccess
        
        if ($Detailed) {
            Write-Host "   Recent commits:" -ForegroundColor $colorInfo
            $commitArray | Select-Object -First 5 | ForEach-Object {
                $parts = $_ -split "\|"
                Write-Host "      📝 $($parts[0])" -NoNewline -ForegroundColor $colorInfo
                Write-Host " - $($parts[1])" -NoNewline -ForegroundColor $colorInfo
                Write-Host " : $($parts[2])" -ForegroundColor Gray
            }
        }
        
        # Check files changed
        $filesChanged = git log --all --since="24 hours ago" --author="$($member.Email)" --name-only --pretty=format:"" 2>$null | Where-Object {$_} | Sort-Object -Unique
        if ($filesChanged) {
            $fileCount = ($filesChanged | Measure-Object).Count
            Write-Host "   📁 $fileCount files changed" -ForegroundColor $colorInfo
            
            if ($Detailed) {
                Write-Host "   Modified areas:" -ForegroundColor $colorInfo
                $filesChanged | Select-Object -First 8 | ForEach-Object {
                    Write-Host "      • $_" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "   ⚠️  No commits in last 24 hours" -ForegroundColor $colorError
        Write-Host "   💡 Action: Check if $($member.Name) has blockers" -ForegroundColor $colorWarning
    }
}

Write-Host ""

# Active Branches
Write-Host "🌿 ACTIVE BRANCHES (Last 7 days)" -ForegroundColor $colorHeader
Draw-Separator
$branches = git for-each-ref --sort=-committerdate --format="%(refname:short)|%(authorname)|%(committerdate:relative)" refs/remotes/ 2>$null | Select-Object -First 10

if ($branches) {
    foreach ($branch in $branches) {
        $parts = $branch -split "\|"
        Write-Host "   🌱 " -NoNewline
        Write-Host "$($parts[0])" -NoNewline -ForegroundColor $colorSuccess
        Write-Host " by $($parts[1])" -NoNewline -ForegroundColor $colorInfo
        Write-Host " ($($parts[2]))" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  No remote branches found" -ForegroundColor $colorInfo
}
Write-Host ""

# Check Pull Requests (if GitHub CLI is available)
if (Test-CommandExists "gh") {
    Write-Host "📋 PULL REQUESTS" -ForegroundColor $colorHeader
    Draw-Separator
    
    try {
        $prs = gh pr list --json number,title,author,state,updatedAt 2>$null | ConvertFrom-Json
        
        if ($prs.Count -gt 0) {
            foreach ($pr in $prs) {
                $timeAgo = (New-TimeSpan -Start $pr.updatedAt -End (Get-Date)).TotalHours
                $status = if ($timeAgo -gt 48) { "🔴 STALE" } elseif ($timeAgo -gt 24) { "🟡 REVIEW" } else { "🟢 FRESH" }
                
                Write-Host "   $status PR #$($pr.number): " -NoNewline
                Write-Host "$($pr.title)" -ForegroundColor $colorSuccess
                Write-Host "      Author: $($pr.author.login) | Updated: $([Math]::Round($timeAgo, 1))h ago" -ForegroundColor $colorInfo
            }
        } else {
            Write-Host "   ℹ️  No open pull requests" -ForegroundColor $colorInfo
        }
    } catch {
        Write-Host "   ⚠️  Could not fetch PRs (check gh auth status)" -ForegroundColor $colorWarning
    }
} else {
    Write-Host "📋 PULL REQUESTS" -ForegroundColor $colorHeader
    Draw-Separator
    Write-Host "   ℹ️  GitHub CLI not installed. Install: winget install GitHub.cli" -ForegroundColor $colorInfo
}
Write-Host ""

# Recent Activity Summary
Write-Host "📊 REPOSITORY ACTIVITY SUMMARY" -ForegroundColor $colorHeader
Draw-Separator

$totalCommits24h = (git log --all --since="24 hours ago" --oneline 2>$null | Measure-Object).Count
$totalCommits7d = (git log --all --since="7 days ago" --oneline 2>$null | Measure-Object).Count

Write-Host "   Last 24 hours: " -NoNewline
Write-Host "$totalCommits24h commits" -ForegroundColor $(if($totalCommits24h -gt 5){"Green"}elseif($totalCommits24h -gt 2){"Yellow"}else{"Red"})

Write-Host "   Last 7 days:   " -NoNewline
Write-Host "$totalCommits7d commits" -ForegroundColor $(if($totalCommits7d -gt 20){"Green"}elseif($totalCommits7d -gt 10){"Yellow"}else{"Red"})

Write-Host ""

# Files changed in last 24 hours
$filesChanged24h = git log --all --since="24 hours ago" --name-only --pretty=format:"" 2>$null | Where-Object {$_} | Sort-Object -Unique
if ($filesChanged24h) {
    $fileCount = ($filesChanged24h | Measure-Object).Count
    Write-Host "   Files changed: $fileCount" -ForegroundColor $colorInfo
    
    # Categorize by directory
    $backendFiles = $filesChanged24h | Where-Object {$_ -like "backend/*"}
    $frontendFiles = $filesChanged24h | Where-Object {$_ -like "frontend/*"}
    $docsFiles = $filesChanged24h | Where-Object {$_ -like "docs/*"}
    
    if ($backendFiles) {
        Write-Host "      🔧 Backend: $(($backendFiles | Measure-Object).Count) files" -ForegroundColor $colorInfo
    }
    if ($frontendFiles) {
        Write-Host "      🎨 Frontend: $(($frontendFiles | Measure-Object).Count) files" -ForegroundColor $colorInfo
    }
    if ($docsFiles) {
        Write-Host "      📚 Docs: $(($docsFiles | Measure-Object).Count) files" -ForegroundColor $colorInfo
    }
}
Write-Host ""

# Health Check
Write-Host "🏥 HEALTH CHECK" -ForegroundColor $colorHeader
Draw-Separator

$issues = @()

# Check if anyone has no activity for 2+ days
foreach ($member in $teamMembers) {
    $lastCommit = git log --all --author="$($member.Email)" --pretty=format:"%ar" -1 2>$null
    if (-not $lastCommit -or $lastCommit -match "days? ago" -and $lastCommit -notmatch "[1] day") {
        $issues += "🚨 $($member.Name) has no commits in 2+ days"
    }
}

# Check for stale branches
$staleBranches = git for-each-ref --sort=-committerdate --format="%(refname:short)|%(committerdate:relative)" refs/remotes/ 2>$null | 
    Where-Object {$_ -match "weeks? ago|months? ago"} | 
    Select-Object -First 3

if ($staleBranches) {
    $issues += "🗑️  Stale branches detected (consider cleanup)"
}

# Check if PRs are old
if (Test-CommandExists "gh") {
    try {
        $stalePRs = gh pr list --json number,updatedAt 2>$null | ConvertFrom-Json | 
            Where-Object { ((New-TimeSpan -Start $_.updatedAt -End (Get-Date)).TotalHours) -gt 48 }
        
        if ($stalePRs.Count -gt 0) {
            $issues += "⏰ $($stalePRs.Count) PR(s) pending review for 2+ days"
        }
    } catch {}
}

if ($issues.Count -eq 0) {
    Write-Host "   ✅ All systems healthy!" -ForegroundColor $colorSuccess
} else {
    Write-Host "   ⚠️  Issues detected:" -ForegroundColor $colorWarning
    foreach ($issue in $issues) {
        Write-Host "      $issue" -ForegroundColor $colorWarning
    }
}
Write-Host ""

# Export report if requested
if ($ExportReport) {
    $reportFile = "team_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    Write-Host "📄 Exporting report to: $reportFile" -ForegroundColor $colorInfo
    
    # Redirect output to file
    $ErrorActionPreference = "SilentlyContinue"
    git log --all --since="24 hours ago" --pretty=format:"%h - %an (%ae)%n   %ar%n   %s%n" > $reportFile
    
    Write-Host "   ✅ Report exported" -ForegroundColor $colorSuccess
    Write-Host ""
}

# Footer
Draw-Separator -Color $colorHeader
Write-Host "✅ Monitoring complete! Run with -Detailed for more info." -ForegroundColor $colorSuccess
Write-Host "💡 Tip: Schedule this script to run daily for automatic tracking" -ForegroundColor $colorInfo
Draw-Separator -Color $colorHeader
Write-Host ""

# Return to original directory
Pop-Location -ErrorAction SilentlyContinue
