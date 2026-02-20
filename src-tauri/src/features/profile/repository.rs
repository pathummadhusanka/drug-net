use rusqlite::{params};
use crate::database::connection::get_connection;
use super::model::Profile;

pub fn insert_profile(profile: Profile) -> Result<i64, String> {
    
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO profiles 
        (full_name, alias, nic, address_line1, address_line2 , city, risk_level, status, notes)
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
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}