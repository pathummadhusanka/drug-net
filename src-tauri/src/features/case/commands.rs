use tauri::State;
use crate::AppState;
use super::model::{Case, CaseWithDetails};

#[tauri::command]
pub async fn create_case(state: State<'_, AppState>, case: Case) -> Result<i64, String> {
    super::service::create_case(&state.db, case)
}

#[tauri::command]
pub async fn get_case(state: State<'_, AppState>, id: i64) -> Result<Option<CaseWithDetails>, String> {
    super::service::get_case(&state.db, id)
}

#[tauri::command]
pub async fn get_all_cases(state: State<'_, AppState>) -> Result<Vec<CaseWithDetails>, String> {
    super::service::list_cases(&state.db)
}
