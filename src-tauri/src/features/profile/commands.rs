use tauri::State;
use crate::AppState;
use super::model::{
    Profile,
    ProfileWithId,
    ProfileDrug,
    ProfileArea,
    ProfileRelationship,
};

#[tauri::command]
pub async fn create_profile(state: State<'_, AppState>, profile: Profile) -> Result<i64, String> {
    super::service::create_profile(&state.db, profile)
}

#[tauri::command]
pub async fn get_profile(state: State<'_, AppState>, id: i64) -> Result<Option<ProfileWithId>, String> {
    super::service::get_profile(&state.db, id)
}

#[tauri::command]
pub async fn get_profile_drugs(state: State<'_, AppState>, id: i64) -> Result<Vec<ProfileDrug>, String> {
    super::service::get_profile_drugs(&state.db, id)
}

#[tauri::command]
pub async fn get_profile_areas(state: State<'_, AppState>, id: i64) -> Result<Vec<ProfileArea>, String> {
    super::service::get_profile_areas(&state.db, id)
}

#[tauri::command]
pub async fn get_profile_relationships(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Vec<ProfileRelationship>, String> {
    super::service::get_profile_relationships(&state.db, id)
}

#[tauri::command]
pub async fn get_all_profiles(state: State<'_, AppState>) -> Result<Vec<ProfileWithId>, String> {
    super::service::list_profiles(&state.db)
}

