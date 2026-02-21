use tauri::State;
use crate::AppState;
use super::model::{Profile, ProfileWithId};

#[tauri::command]
pub async fn create_profile(state: State<'_, AppState>, profile: Profile) -> Result<i64, String> {
    super::service::create_profile(&state.db, profile)
}

#[tauri::command]
pub async fn get_profile(state: State<'_, AppState>, id: i64) -> Result<Option<ProfileWithId>, String> {
    super::service::get_profile(&state.db, id)
}

