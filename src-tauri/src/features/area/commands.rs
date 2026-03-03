use tauri::State;
use crate::AppState;
use super::model::{Area, NewArea};

#[tauri::command]
pub async fn create_area(state: State<'_, AppState>, area: NewArea) -> Result<i64, String> {
    super::service::create_area(&state.db, area)
}

#[tauri::command]
pub async fn get_area(state: State<'_, AppState>, id: i64) -> Result<Option<Area>, String> {
    super::service::get_area(&state.db, id)
}

#[tauri::command]
pub async fn get_area_by_name(state: State<'_, AppState>, name: String) -> Result<Option<Area>, String> {
    super::service::get_area_by_name(&state.db, &name)
}

#[tauri::command]
pub async fn get_all_areas(state: State<'_, AppState>) -> Result<Vec<Area>, String> {
    super::service::list_areas(&state.db)
}

#[tauri::command]
pub async fn delete_area(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    super::service::remove_area(&state.db, id)
}
