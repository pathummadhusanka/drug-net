use super::model::Profile;

pub fn create_profile(profile: Profile) -> Result<i64, String> {
    
    super::repository::insert_profile(profile)
}
