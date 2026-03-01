use rusqlite::params;
use crate::database::connection::DbConnection;
use super::model::{
    Profile,
    ProfileWithId,
    ProfileDrug,
    ProfileArea,
    ProfileRelationship,
};

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

pub fn get_profile_drugs(db: &DbConnection, id: i64) -> Result<Vec<ProfileDrug>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT d.id, d.name
         FROM profile_drugs pd
         JOIN drugs d ON d.id = pd.drug_id
         WHERE pd.profile_id = ?1
         ORDER BY d.name"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let rows = stmt
        .query_map(params![id], |row| {
            Ok(ProfileDrug {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .map_err(|e| format!("Database error: {}", e))?;

    rows
        .collect::<Result<Vec<ProfileDrug>, _>>()
        .map_err(|e| format!("Database error: {}", e))
}

pub fn get_profile_areas(db: &DbConnection, id: i64) -> Result<Vec<ProfileArea>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT a.id, a.name, pa.is_primary
         FROM profile_areas pa
         JOIN areas a ON a.id = pa.area_id
         WHERE pa.profile_id = ?1
         ORDER BY pa.is_primary DESC, a.name"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let rows = stmt
        .query_map(params![id], |row| {
            Ok(ProfileArea {
                id: row.get(0)?,
                name: row.get(1)?,
                is_primary: row.get(2)?,
            })
        })
        .map_err(|e| format!("Database error: {}", e))?;

    rows
        .collect::<Result<Vec<ProfileArea>, _>>()
        .map_err(|e| format!("Database error: {}", e))
}

pub fn get_profile_relationships(
    db: &DbConnection,
    id: i64,
) -> Result<Vec<ProfileRelationship>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT
            r.id,
            CASE
                WHEN r.source_profile_id = ?1 THEN r.target_profile_id
                ELSE r.source_profile_id
            END AS target_profile_id,
            p.full_name,
            r.relationship_type
         FROM relationships r
         JOIN profiles p
           ON p.id = CASE
               WHEN r.source_profile_id = ?1 THEN r.target_profile_id
               ELSE r.source_profile_id
           END
         WHERE r.source_profile_id = ?1 OR r.target_profile_id = ?1
         ORDER BY p.full_name"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let rows = stmt
        .query_map(params![id], |row| {
            Ok(ProfileRelationship {
                id: row.get(0)?,
                target_profile_id: row.get(1)?,
                target_full_name: row.get(2)?,
                relationship_type: row.get(3)?,
            })
        })
        .map_err(|e| format!("Database error: {}", e))?;

    rows
        .collect::<Result<Vec<ProfileRelationship>, _>>()
        .map_err(|e| format!("Database error: {}", e))
}

pub fn get_all_profiles(db: &DbConnection) -> Result<Vec<ProfileWithId>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT id, full_name, alias, nic, address_line1, address_line2, city, risk_level, status, notes, created_at
         FROM profiles
         ORDER BY created_at DESC, id DESC"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
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
        })
        .map_err(|e| format!("Database error: {}", e))?;

    rows
        .collect::<Result<Vec<ProfileWithId>, _>>()
        .map_err(|e| format!("Database error: {}", e))
}

pub fn delete_profile_by_id(db: &DbConnection, id: i64) -> Result<bool, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let rows_affected = conn
        .execute("DELETE FROM profiles WHERE id = ?1", params![id])
        .map_err(|e| format!("Database error: {}", e))?;

    Ok(rows_affected > 0)
}
