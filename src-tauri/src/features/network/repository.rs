use rusqlite::params;

use crate::database::connection::DbConnection;

use super::model::{NetworkNodePosition, NetworkNodePositionInput};

pub fn get_positions(db: &DbConnection) -> Result<Vec<NetworkNodePosition>, String> {
    let conn = db
        .lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn
        .prepare(
            "SELECT profile_id, x, y
             FROM network_node_positions
             ORDER BY profile_id",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(NetworkNodePosition {
                profile_id: row.get(0)?,
                x: row.get(1)?,
                y: row.get(2)?,
            })
        })
        .map_err(|e| format!("Database error: {}", e))?;

    rows
        .collect::<Result<Vec<NetworkNodePosition>, _>>()
        .map_err(|e| format!("Database error: {}", e))
}

pub fn upsert_positions(
    db: &DbConnection,
    positions: Vec<NetworkNodePositionInput>,
) -> Result<(), String> {
    if positions.is_empty() {
        return Ok(());
    }

    let mut conn = db
        .lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    for position in positions {
        tx.execute(
            "INSERT INTO network_node_positions (profile_id, x, y, updated_at)
             VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)
             ON CONFLICT(profile_id)
             DO UPDATE SET x = excluded.x, y = excluded.y, updated_at = CURRENT_TIMESTAMP",
            params![position.profile_id, position.x, position.y],
        )
        .map_err(|e| format!("Database error: {}", e))?;
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(())
}

pub fn sync_positions(db: &DbConnection, profile_ids: Vec<i64>) -> Result<(), String> {
    let conn = db
        .lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    if profile_ids.is_empty() {
        conn.execute("DELETE FROM network_node_positions", [])
            .map_err(|e| format!("Database error: {}", e))?;
        return Ok(());
    }

    let placeholders = profile_ids
        .iter()
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(", ");

    let sql = format!(
        "DELETE FROM network_node_positions WHERE profile_id NOT IN ({})",
        placeholders
    );

    conn.execute(
        &sql,
        rusqlite::params_from_iter(profile_ids.iter().copied()),
    )
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(())
}