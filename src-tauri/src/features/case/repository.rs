use rusqlite::params;
use crate::database::connection::DbConnection;
use super::model::{Case, CaseWithDetails, CaseRelationshipData};


fn generate_cno(db: &DbConnection) -> Result<String, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Get the count of existing cases to generate the next case number
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM cases", [], |row| row.get(0))
        .map_err(|e| format!("Failed to count cases: {}", e))?;

    // Generate CNO as C + 6-digit zero-padded number (e.g., C000001)
    let next_number = count + 1;
    Ok(format!("C{:06}", next_number))
}

pub fn insert_case(db: &DbConnection, case: Case) -> Result<i64, String> {
    let cno = generate_cno(db)?;
    
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    conn.execute(
        "INSERT INTO cases (cno, case_id, case_name, description, case_type, status, severity_level, notes, case_date, case_time)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            cno,
            case.case_id,
            case.case_name,
            case.description,
            case.case_type,
            case.status,
            case.severity_level,
            case.notes,
            case.case_date,
            case.case_time,
        ],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(conn.last_insert_rowid())
}

pub fn get_case_by_id(db: &DbConnection, id: i64) -> Result<Option<CaseWithDetails>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT id, cno, case_id, case_name, description, case_type, status, severity_level, notes, case_date, case_time, created_at, updated_at 
         FROM cases 
         WHERE id = ?1"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let case = stmt.query_row(params![id], |row| {
        Ok(CaseWithDetails {
            id: row.get(0)?,
            cno: row.get(1)?,
            case_id: row.get(2)?,
            case_name: row.get(3)?,
            description: row.get(4)?,
            case_type: row.get(5)?,
            status: row.get(6)?,
            severity_level: row.get(7)?,
            notes: row.get(8)?,
            case_date: row.get(9)?,
            case_time: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    });

    match case {
        Ok(c) => Ok(Some(c)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

pub fn get_all_cases(db: &DbConnection) -> Result<Vec<CaseWithDetails>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT id, cno, case_id, case_name, description, case_type, status, severity_level, notes, case_date, case_time, created_at, updated_at 
         FROM cases 
         ORDER BY created_at DESC"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let cases = stmt.query_map([], |row| {
        Ok(CaseWithDetails {
            id: row.get(0)?,
            cno: row.get(1)?,
            case_id: row.get(2)?,
            case_name: row.get(3)?,
            description: row.get(4)?,
            case_type: row.get(5)?,
            status: row.get(6)?,
            severity_level: row.get(7)?,
            notes: row.get(8)?,
            case_date: row.get(9)?,
            case_time: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })
    .map_err(|e| format!("Query error: {}", e))?
    .collect::<Result<Vec<CaseWithDetails>, _>>()
    .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(cases)
}

pub fn link_case_to_profile(
    db: &DbConnection,
    case_id: i64,
    profile_id: i64,
) -> Result<(), String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    conn.execute(
        "INSERT OR IGNORE INTO case_profiles (case_id, profile_id)
         VALUES (?1, ?2)",
        params![case_id, profile_id],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(())
}

pub fn get_cases_by_profile_id(
    db: &DbConnection,
    profile_id: i64,
) -> Result<Vec<CaseWithDetails>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT c.id, c.cno, c.case_id, c.case_name, c.description, c.case_type, c.status, c.severity_level, c.notes, c.case_date, c.case_time, c.created_at, c.updated_at
         FROM cases c
         JOIN case_profiles cp ON cp.case_id = c.id
         WHERE cp.profile_id = ?1
         ORDER BY c.created_at DESC"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let cases = stmt.query_map(params![profile_id], |row| {
        Ok(CaseWithDetails {
            id: row.get(0)?,
            cno: row.get(1)?,
            case_id: row.get(2)?,
            case_name: row.get(3)?,
            description: row.get(4)?,
            case_type: row.get(5)?,
            status: row.get(6)?,
            severity_level: row.get(7)?,
            notes: row.get(8)?,
            case_date: row.get(9)?,
            case_time: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })
    .map_err(|e| format!("Query error: {}", e))?
    .collect::<Result<Vec<CaseWithDetails>, _>>()
    .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(cases)
}

pub fn link_case_to_area(
    db: &DbConnection,
    case_id: i64,
    area_id: i64,
) -> Result<(), String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    conn.execute(
        "INSERT OR IGNORE INTO case_areas (case_id, area_id)
         VALUES (?1, ?2)",
        params![case_id, area_id],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(())
}

pub fn get_case_areas(
    db: &DbConnection,
    case_id: i64,
) -> Result<Vec<String>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT a.name
         FROM areas a
         JOIN case_areas ca ON ca.area_id = a.id
         WHERE ca.case_id = ?1
         ORDER BY a.name ASC"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let areas = stmt.query_map(params![case_id], |row| {
        row.get(0)
    })
    .map_err(|e| format!("Query error: {}", e))?
    .collect::<Result<Vec<String>, _>>()
    .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(areas)
}
pub fn save_case_relationships(
    db: &DbConnection,
    case_id: i64,
    relationships: Vec<CaseRelationshipData>,
) -> Result<(), String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    for rel in relationships {
        // First, verify both profiles exist
        let source_exists: bool = conn
            .query_row(
                "SELECT 1 FROM profiles WHERE id = ?1",
                params![rel.source_profile_id],
                |_| Ok(true),
            )
            .unwrap_or(false);

        let target_exists: bool = conn
            .query_row(
                "SELECT 1 FROM profiles WHERE id = ?1",
                params![rel.target_profile_id],
                |_| Ok(true),
            )
            .unwrap_or(false);

        if !source_exists {
            return Err(format!(
                "Source profile {} does not exist in database",
                rel.source_profile_id
            ));
        }
        if !target_exists {
            return Err(format!(
                "Target profile {} does not exist in database",
                rel.target_profile_id
            ));
        }

        // Check if relationship already exists (in either direction)
        let rel_id = conn.query_row(
            "SELECT id FROM relationships 
             WHERE (source_profile_id = ?1 AND target_profile_id = ?2)
             OR (source_profile_id = ?2 AND target_profile_id = ?1)",
            params![rel.source_profile_id, rel.target_profile_id],
            |row| row.get::<_, i64>(0),
        );

        let relationship_id = match rel_id {
            Ok(id) => id,
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                // Create new relationship
                conn.execute(
                    "INSERT INTO relationships (source_profile_id, target_profile_id, relationship_type)
                     VALUES (?1, ?2, ?3)",
                    params![rel.source_profile_id, rel.target_profile_id, rel.relationship_type],
                )
                .map_err(|e| {
                    format!(
                        "Failed to create relationship between {} and {}: {}",
                        rel.source_profile_id, rel.target_profile_id, e
                    )
                })?;
                conn.last_insert_rowid()
            }
            Err(e) => return Err(format!("Database error querying relationships: {}", e)),
        };

        // Link relationship to case
        conn.execute(
            "INSERT OR IGNORE INTO case_relationships (case_id, relationship_id)
             VALUES (?1, ?2)",
            params![case_id, relationship_id],
        )
        .map_err(|e| format!("Failed to link relationship to case: {}", e))?;
    }

    Ok(())
}

pub fn get_case_relationships(
    db: &DbConnection,
    case_id: i64,
) -> Result<Vec<CaseRelationshipData>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT r.source_profile_id, r.target_profile_id, r.relationship_type
         FROM relationships r
         JOIN case_relationships cr ON cr.relationship_id = r.id
         WHERE cr.case_id = ?1"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let relationships = stmt.query_map(params![case_id], |row| {
        Ok(CaseRelationshipData {
            source_profile_id: row.get(0)?,
            target_profile_id: row.get(1)?,
            relationship_type: row.get(2)?,
        })
    })
    .map_err(|e| format!("Query error: {}", e))?
    .collect::<Result<Vec<CaseRelationshipData>, _>>()
    .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(relationships)
}

pub fn delete_case(db: &DbConnection, case_id: i64) -> Result<(), String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    conn.execute("DELETE FROM cases WHERE id = ?1", params![case_id])
        .map_err(|e| format!("Failed to delete case: {}", e))?;

    Ok(())
}

pub fn get_case_profiles(db: &DbConnection, case_id: i64) -> Result<Vec<(i64, String)>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT p.id, p.full_name
         FROM profiles p
         JOIN case_profiles cp ON cp.profile_id = p.id
         WHERE cp.case_id = ?1
         ORDER BY p.full_name ASC"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let profiles = stmt.query_map(params![case_id], |row| {
        Ok((row.get(0)?, row.get(1)?))
    })
    .map_err(|e| format!("Query error: {}", e))?
    .collect::<Result<Vec<(i64, String)>, _>>()
    .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(profiles)
}