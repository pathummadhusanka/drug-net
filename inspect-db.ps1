# Database Inspection Script
# Run this script to inspect the drug_net database structure and data

$dbPath = "drug_net.db"

if (-not (Test-Path $dbPath)) {
    Write-Host "Database file not found at: $dbPath" -ForegroundColor Red
    Write-Host "The database will be created when you first run the application." -ForegroundColor Yellow
    exit
}

Write-Host "=== Database Structure ===" -ForegroundColor Green
Write-Host ""

# Check if sqlite3 is available
$sqliteCmd = Get-Command sqlite3 -ErrorAction SilentlyContinue

if (-not $sqliteCmd) {
    Write-Host "sqlite3 command not found. Please install SQLite to inspect the database." -ForegroundColor Red
    Write-Host "Alternatively, you can use a GUI tool like DB Browser for SQLite." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Database location: $((Get-Location).Path)\$dbPath" -ForegroundColor Cyan
    exit
}

# Display all tables
Write-Host "Tables:" -ForegroundColor Cyan
sqlite3 $dbPath ".tables"
Write-Host ""

# Display schema for each table
Write-Host "=== Table Schemas ===" -ForegroundColor Green
Write-Host ""

$tables = @("profiles", "drugs", "profile_drugs", "areas", "profile_areas", "relationships", "cases", "case_profiles")

foreach ($table in $tables) {
    Write-Host "Table: $table" -ForegroundColor Cyan
    sqlite3 $dbPath ".schema $table"
    Write-Host ""
}

# Display data counts
Write-Host "=== Data Counts ===" -ForegroundColor Green
Write-Host ""

foreach ($table in $tables) {
    $count = sqlite3 $dbPath "SELECT COUNT(*) FROM $table;"
    Write-Host "${table}: $count rows" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Sample Data ===" -ForegroundColor Green
Write-Host ""

# Show sample data from each table
foreach ($table in $tables) {
    $count = sqlite3 $dbPath "SELECT COUNT(*) FROM $table;"
    if ($count -gt 0) {
        Write-Host "--- $table (first 5 rows) ---" -ForegroundColor Cyan
        sqlite3 $dbPath -header -column "SELECT * FROM $table LIMIT 5;"
        Write-Host ""
    }
}

Write-Host "Inspection complete!" -ForegroundColor Green
