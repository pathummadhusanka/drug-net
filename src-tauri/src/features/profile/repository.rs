use rusqlite::params;
use crate::database::connection::DbConnection;
use super::model::{Profile, ProfileWithId};

pub fn insert_profile(db: &DbConnection, profile: Profile) -> Result<i64, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    conn.execute(
        "INSERT INTO profiles 
        (full_name, alias, nic, address_line1, address_line2, city, risk_level, status, notes)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            profile.full_name,
            profile.alias,
            profile.nic,
            profile.address_line1,
            profile.address_line2,
            profile.city,
            profile.risk_level,
            profile.status,
            profile.notes
        ],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(conn.last_insert_rowid())
}

pub fn get_profile_by_id(db: &DbConnection, id: i64) -> Result<Option<ProfileWithId>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT id, full_name, alias, nic, address_line1, address_line2, city, risk_level, status, notes, created_at 
         FROM profiles 
         WHERE id = ?1"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let profile = stmt.query_row(params![id], |row| {
        Ok(ProfileWithId {
            id: row.get(0)?,
            full_name: row.get(1)?,
            alias: row.get(2)?,
            nic: row.get(3)?,
            address_line1: row.get(4)?,
            address_line2: row.get(5)?,
            city: row.get(6)?,
            risk_level: row.get(7)?,
            status: row.get(8)?,
            notes: row.get(9)?,
            created_at: row.get(10)?,
        })
    });

    match profile {
        Ok(p) => Ok(Some(p)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}
