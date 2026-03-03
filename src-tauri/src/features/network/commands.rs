use tauri::State;

use crate::AppState;

use super::model::{NetworkNodePosition, NetworkNodePositionInput};

#[tauri::command]
pub async fn get_network_node_positions(
    state: State<'_, AppState>,
) -> Result<Vec<NetworkNodePosition>, String> {
    super::service::get_network_node_positions(&state.db)
}

#[tauri::command]
pub async fn upsert_network_node_positions(
    state: State<'_, AppState>,
    positions: Vec<NetworkNodePositionInput>,
) -> Result<(), String> {
    super::service::upsert_network_node_positions(&state.db, positions)
}

#[tauri::command]
pub async fn sync_network_node_positions(
    state: State<'_, AppState>,
    profile_ids: Vec<i64>,
) -> Result<(), String> {
    super::service::sync_network_node_positions(&state.db, profile_ids)
}