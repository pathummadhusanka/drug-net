use tauri::State;
use crate::AppState;
use super::model::{Case, CaseWithDetails, CaseRelationshipData};


#[tauri::command]
pub async fn create_case(state: State<'_, AppState>, case: Case) -> Result<i64, String> {
    super::service::create_case(&state.db, case)
}

#[tauri::command]
pub async fn update_case(state: State<'_, AppState>, id: i64, case: Case) -> Result<(), String> {
    super::service::update_case(&state.db, id, case)
}

#[tauri::command]
pub async fn get_case(state: State<'_, AppState>, id: i64) -> Result<Option<CaseWithDetails>, String> {
    super::service::get_case(&state.db, id)
}

#[tauri::command]
pub async fn get_all_cases(state: State<'_, AppState>) -> Result<Vec<CaseWithDetails>, String> {
    super::service::list_cases(&state.db)
}

#[tauri::command]
pub async fn search_cases(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<CaseWithDetails>, String> {
    super::service::search_cases(&state.db, query)
}

#[tauri::command]
pub async fn assign_case_to_profile(
    state: State<'_, AppState>,
    case_id: i64,
    profile_id: i64,
) -> Result<(), String> {
    super::service::assign_case_to_profile(&state.db, case_id, profile_id)
}

#[tauri::command]
pub async fn get_profile_cases(
    state: State<'_, AppState>,
    profile_id: i64,
) -> Result<Vec<CaseWithDetails>, String> {
    super::service::list_cases_by_profile(&state.db, profile_id)
}

#[tauri::command]
pub async fn link_case_to_area(
    state: State<'_, AppState>,
    case_id: i64,
    area_id: i64,
) -> Result<(), String> {
    super::service::assign_case_to_area(&state.db, case_id, area_id)
}

#[tauri::command]
pub async fn get_case_areas(
    state: State<'_, AppState>,
    case_id: i64,
) -> Result<Vec<String>, String> {
    super::service::get_areas_for_case(&state.db, case_id)
}

#[tauri::command]
pub async fn save_case_attachments(
    state: State<'_, AppState>,
    case_id: i64,
    attached_case_ids: Vec<i64>,
) -> Result<(), String> {
    super::service::save_case_attachments(&state.db, case_id, attached_case_ids)
}

#[tauri::command]
pub async fn get_case_attachments(
    state: State<'_, AppState>,
    case_id: i64,
) -> Result<Vec<CaseWithDetails>, String> {
    super::service::get_case_attachments(&state.db, case_id)
}

#[tauri::command]
pub async fn save_case_relationships(
    state: State<'_, AppState>,
    case_id: i64,
    relationships: Vec<CaseRelationshipData>,
) -> Result<(), String> {
    super::service::save_case_relationships(&state.db, case_id, relationships)
}

#[tauri::command]
pub async fn get_case_relationships(
    state: State<'_, AppState>,
    case_id: i64,
) -> Result<Vec<CaseRelationshipData>, String> {
    super::service::get_case_relationships(&state.db, case_id)
}

#[tauri::command]
pub async fn delete_case(state: State<'_, AppState>, case_id: i64) -> Result<(), String> {
    super::service::delete_case(&state.db, case_id)
}

#[tauri::command]
pub async fn get_case_profiles(
    state: State<'_, AppState>,
    case_id: i64,
) -> Result<Vec<(i64, String)>, String> {
    super::service::get_case_profiles(&state.db, case_id)
}