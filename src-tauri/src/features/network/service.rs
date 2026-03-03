use crate::database::connection::DbConnection;

use super::model::{NetworkNodePosition, NetworkNodePositionInput};

pub fn get_network_node_positions(db: &DbConnection) -> Result<Vec<NetworkNodePosition>, String> {
    super::repository::get_positions(db)
}

pub fn upsert_network_node_positions(
    db: &DbConnection,
    positions: Vec<NetworkNodePositionInput>,
) -> Result<(), String> {
    super::repository::upsert_positions(db, positions)
}

pub fn sync_network_node_positions(db: &DbConnection, profile_ids: Vec<i64>) -> Result<(), String> {
    super::repository::sync_positions(db, profile_ids)
}