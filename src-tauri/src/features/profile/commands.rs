use tauri::State;
use crate::AppState;
use super::model::Profile;

#[tauri::command]
pub async fn create_profile(state: State<'_, AppState>, profile: Profile) -> Result<i64, String> {
    super::service::create_profile(&state.db, profile)
}
