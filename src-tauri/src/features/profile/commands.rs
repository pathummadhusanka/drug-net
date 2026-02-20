use super::model::Profile;

#[tauri::command]
pub async fn create_profile(profile: Profile) -> Result<i64, String> {
    
    super::service::create_profile(profile)
}
