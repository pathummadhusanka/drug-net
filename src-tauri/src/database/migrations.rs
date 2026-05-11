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
            name TEXT NOT NULL UNIQUE,
            quantified_by TEXT NOT NULL DEFAULT 'grams'
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
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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

        CREATE TABLE IF NOT EXISTS case_attachments (
            case_id INTEGER,
            attached_case_id INTEGER,
            PRIMARY KEY (case_id, attached_case_id),
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
            FOREIGN KEY (attached_case_id) REFERENCES cases(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_case_attachments_unique ON case_attachments(case_id, attached_case_id);

        CREATE TABLE IF NOT EXISTS case_relationships (
            case_id INTEGER,
            relationship_id INTEGER,
            PRIMARY KEY (case_id, relationship_id),
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
            FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS case_drugs (
            case_id INTEGER,
            drug_id INTEGER,
            quantity TEXT,
            PRIMARY KEY (case_id, drug_id),
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
            FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS network_node_positions (
            profile_id INTEGER PRIMARY KEY,
            x REAL NOT NULL,
            y REAL NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
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
        "updated_at",
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

    conn.execute(
        "UPDATE cases
         SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
         WHERE updated_at IS NULL",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Add quantified_by column to drugs table if it doesn't exist
    match conn.execute("ALTER TABLE drugs ADD COLUMN quantified_by TEXT NOT NULL DEFAULT 'grams'", []) {
        Ok(_) => {}
        Err(e) if e.to_string().contains("duplicate column name") => {}
        Err(e) => return Err(e.to_string()),
    }

    // Seed drugs table with common drugs if empty
    let drug_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM drugs", [], |row| row.get(0))
        .unwrap_or(0);

    if drug_count == 0 {
        let drugs = vec![
            ("Heroin", "grams"),
            ("Cocaine", "grams"),
            ("Methamphetamine", "grams"),
            ("Cannabis", "grams"),
            ("MDMA (Ecstasy)", "pills"),
            ("LSD", "tabs"),
            ("Fentanyl", "grams"),
            ("Amphetamine", "grams"),
            ("Ketamine", "grams"),
            ("PCP", "grams"),
            ("Morphine", "grams"),
            ("Codeine", "pills"),
            ("Oxycodone", "pills"),
            ("Hydrocodone", "pills"),
            ("Methadone", "mg"),
        ];

        for (name, unit) in drugs {
            conn.execute(
                "INSERT OR IGNORE INTO drugs (name, quantified_by) VALUES (?1, ?2)",
                [name, unit],
            )
            .map_err(|e| format!("Failed to seed drug {}: {}", name, e))?;
        }
    }

    Ok(())
}
