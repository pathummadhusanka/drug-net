# Database Structure Documentation

## Overview

The application uses SQLite database (`drug_net.db`) with the following structure:

## Tables

### 1. profiles

Stores information about individuals in the drug network.

**Columns:**

- `id` (INTEGER PRIMARY KEY) - Unique identifier
- `full_name` (TEXT NOT NULL) - Full name of the person
- `alias` (TEXT) - Alternative name or nickname
- `nic` (TEXT UNIQUE) - National Identity Card number (must be unique)
- `address_line1` (TEXT) - First line of address
- `address_line2` (TEXT) - Second line of address
- `city` (TEXT) - City name
- `risk_level` (TEXT) - Risk assessment level
- `status` (TEXT) - Current status of the profile
- `notes` (TEXT) - Additional notes
- `created_at` (TEXT) - Timestamp when profile was created
- `updated_at` (TEXT) - Timestamp when profile was last updated

### 2. drugs

Reference table for drug types.

**Columns:**

- `id` (INTEGER PRIMARY KEY) - Unique identifier
- `name` (TEXT NOT NULL UNIQUE) - Drug name (must be unique)

### 3. profile_drugs

Links profiles to drugs (many-to-many relationship).

**Columns:**

- `profile_id` (INTEGER) - Foreign key to profiles table
- `drug_id` (INTEGER) - Foreign key to drugs table
- PRIMARY KEY: (profile_id, drug_id)

### 4. areas

Reference table for geographic areas.

**Columns:**

- `id` (INTEGER PRIMARY KEY) - Unique identifier
- `name` (TEXT NOT NULL UNIQUE) - Area name (must be unique)

### 5. profile_areas

Links profiles to geographic areas (many-to-many relationship).

**Columns:**

- `profile_id` (INTEGER) - Foreign key to profiles table
- `area_id` (INTEGER) - Foreign key to areas table
- `is_primary` (INTEGER) - Flag indicating if this is the primary area (0 or 1)
- PRIMARY KEY: (profile_id, area_id)

### 6. relationships

Stores connections between profiles.

**Columns:**

- `id` (INTEGER PRIMARY KEY) - Unique identifier
- `source_profile_id` (INTEGER) - Foreign key to profiles table (source)
- `target_profile_id` (INTEGER) - Foreign key to profiles table (target)
- `relationship_type` (TEXT) - Type of relationship (e.g., "associate", "supplier")

### 7. cases

Stores case information.

**Columns:**

- `id` (INTEGER PRIMARY KEY) - Unique identifier
- `cno` (TEXT NOT NULL UNIQUE) - Case Number (auto-generated, unique)
- `case_id` (TEXT) - External case ID reference
- `case_name` (TEXT NOT NULL) - Name/title of the case
- `created_at` (TEXT) - Timestamp when case was created

**Note:** CNO format is `C` followed by 6-digit zero-padded number (e.g., C000001, C000002)

### 8. case_profiles

Links cases to profiles (many-to-many relationship).

**Columns:**

- `case_id` (INTEGER) - Foreign key to cases table
- `profile_id` (INTEGER) - Foreign key to profiles table
- PRIMARY KEY: (case_id, profile_id)

## Relationships

```
profiles (1) ----< (M) profile_drugs (M) >---- (1) drugs
profiles (1) ----< (M) profile_areas (M) >---- (1) areas
profiles (1) ----< (M) relationships (source)
profiles (1) ----< (M) relationships (target)
profiles (1) ----< (M) case_profiles (M) >---- (1) cases
```

## Database Location

- **Development Mode:** `./drug_net.db` (in project root)
- **Production Mode:** `%APPDATA%/DrugNet/drug_net.db`

## Inspecting the Database

### Method 1: Using PowerShell Script

Run the included inspection script:

```powershell
.\inspect-db.ps1
```

### Method 2: Using SQLite Command Line

```powershell
sqlite3 drug_net.db
```

Then run SQL queries:

```sql
-- List all tables
.tables

-- Show table structure
.schema profiles

-- Query data
SELECT * FROM profiles;
SELECT * FROM cases;
```

### Method 3: Using DB Browser for SQLite

1. Download from: https://sqlitebrowser.org/
2. Open `drug_net.db` with the application
3. Browse tables and data visually

## Current Data

The database is created automatically when the application first runs. Initially, it will be empty with no data.

Data is populated through:

- Creating new profiles via the UI
- Filing cases
- Adding relationships between profiles
- Associating drugs and areas with profiles
