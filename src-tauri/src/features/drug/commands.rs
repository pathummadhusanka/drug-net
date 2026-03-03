use tauri::State;
use crate::AppState;
use super::model::{Drug, CaseDrugData, CaseDrugWithDetails};

#[tauri::command]
pub async fn get_all_drugs(state: State<'_, AppState>) -> Result<Vec<Drug>, String> {
    super::service::list_drugs(&state.db)
}

#[tauri::command]
pub async fn save_case_drugs(
    state: State<'_, AppState>,
    case_id: i64,
    drugs: Vec<CaseDrugData>,
) -> Result<(), String> {
    super::service::save_case_drugs(&state.db, case_id, drugs)
}

#[tauri::command]
pub async fn get_case_drugs(
    state: State<'_, AppState>,
    case_id: i64,
) -> Result<Vec<CaseDrugWithDetails>, String> {
    super::service::get_case_drugs(&state.db, case_id)
}
