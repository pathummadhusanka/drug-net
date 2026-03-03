use rusqlite::params;
use crate::database::connection::DbConnection;
use super::model::{Area, NewArea};

pub fn insert_area(db: &DbConnection, area: NewArea) -> Result<i64, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Check if area already exists
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM areas WHERE name = ?1)",
            params![area.name],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to check area existence: {}", e))?;

    if exists {
        // Return the existing area's ID
        let id: i64 = conn
            .query_row(
                "SELECT id FROM areas WHERE name = ?1",
                params![area.name],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to get existing area ID: {}", e))?;
        return Ok(id);
    }

    // Insert new area
    conn.execute(
        "INSERT INTO areas (name) VALUES (?1)",
        params![area.name],
    )
    .map_err(|e| format!("Failed to insert area: {}", e))?;

    Ok(conn.last_insert_rowid())
}

pub fn get_area_by_id(db: &DbConnection, id: i64) -> Result<Option<Area>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT id, name FROM areas WHERE id = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let area = stmt.query_row(params![id], |row| {
        Ok(Area {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    });

    match area {
        Ok(a) => Ok(Some(a)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

pub fn get_area_by_name(db: &DbConnection, name: &str) -> Result<Option<Area>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT id, name FROM areas WHERE name = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let area = stmt.query_row(params![name], |row| {
        Ok(Area {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    });

    match area {
        Ok(a) => Ok(Some(a)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

pub fn get_all_areas(db: &DbConnection) -> Result<Vec<Area>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT id, name FROM areas ORDER BY name ASC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let areas = stmt
        .query_map([], |row| {
            Ok(Area {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .map_err(|e| format!("Query error: {}", e))?
        .collect::<Result<Vec<Area>, _>>()
        .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(areas)
}

pub fn delete_area(db: &DbConnection, id: i64) -> Result<(), String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    conn.execute("DELETE FROM areas WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete area: {}", e))?;

    Ok(())
}
