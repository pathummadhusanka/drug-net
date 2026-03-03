use super::connection::DbConnection;

pub fn run_migrations(db: &DbConnection) -> Result<(), String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;
    
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY,
            full_name TEXT NOT NULL,
            alias TEXT,
            nic TEXT UNIQUE,
            address_line1 TEXT,
            address_line2 TEXT,
            city TEXT,
            risk_level TEXT,
            status TEXT,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS drugs (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS profile_drugs (
            profile_id INTEGER,
            drug_id INTEGER,
            PRIMARY KEY (profile_id, drug_id),
            FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS areas (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS profile_areas (
            profile_id INTEGER,
            area_id INTEGER,
            is_primary INTEGER DEFAULT 0,
            PRIMARY KEY (profile_id, area_id),
            FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS relationships (
            id INTEGER PRIMARY KEY,
            source_profile_id INTEGER,
            target_profile_id INTEGER,
            relationship_type TEXT,
            FOREIGN KEY (source_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (target_profile_id) REFERENCES profiles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY,
            cno TEXT NOT NULL UNIQUE,
            case_id TEXT,
            case_name TEXT NOT NULL,
            description TEXT,
            case_type TEXT,
            status TEXT,
            severity_level TEXT,
            notes TEXT,
            case_date TEXT,
            case_time TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS case_profiles (
            case_id INTEGER,
            profile_id INTEGER,
            PRIMARY KEY (case_id, profile_id),
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
            FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS case_areas (
            case_id INTEGER,
            area_id INTEGER,
            PRIMARY KEY (case_id, area_id),
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
            FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
        );
        "
    )
    .map_err(|e| e.to_string())?;

    match conn.execute("ALTER TABLE profiles ADD COLUMN updated_at TEXT", []) {
        Ok(_) => {}
        Err(e) if e.to_string().contains("duplicate column name") => {}
        Err(e) => return Err(e.to_string()),
    }

    conn.execute(
        "UPDATE profiles
         SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
         WHERE updated_at IS NULL",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Add new case fields if they don't exist
    let case_columns = [
        "description",
        "case_type",
        "status",
        "severity_level",
        "notes",
        "case_date",
        "case_time",
    ];

    for column in case_columns.iter() {
        match conn.execute(
            &format!("ALTER TABLE cases ADD COLUMN {} TEXT", column),
            [],
        ) {
            Ok(_) => {}
            Err(e) if e.to_string().contains("duplicate column name") => {}
            Err(e) => return Err(e.to_string()),
        }
    }

    Ok(())
}
