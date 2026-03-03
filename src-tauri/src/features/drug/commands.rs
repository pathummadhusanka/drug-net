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

#[tauri::command]
pub async fn add_drug(
    state: State<'_, AppState>,
    name: String,
    quantified_by: String,
) -> Result<i64, String> {
    super::service::add_drug(&state.db, name, quantified_by)
}

#[tauri::command]
pub async fn delete_drug(state: State<'_, AppState>, drug_id: i64) -> Result<(), String> {
    // First check if the drug is in use
    let in_use = super::service::is_drug_in_use(&state.db, drug_id)?;
    if in_use {
        return Err("Cannot delete drug: it is currently used in one or more cases".to_string());
    }
    super::service::delete_drug(&state.db, drug_id)
}

#[tauri::command]
pub async fn is_drug_in_use(state: State<'_, AppState>, drug_id: i64) -> Result<bool, String> {
    super::service::is_drug_in_use(&state.db, drug_id)
}
