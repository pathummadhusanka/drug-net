use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY,
            full_name TEXT NOT NULL,
            alias TEXT,
            nic TEXT UNIQUE,
            address TEXT,
            risk_level TEXT,
            status TEXT,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
        "
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
