#[tauri::command]
pub async fn get_person_by_id(id: i64) -> Result<super::model::Person, String> {
    super::service::get_person(id)
}
