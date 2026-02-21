use crate::database::connection::DbConnection;
use super::model::{Profile, ProfileWithId};

pub fn create_profile(db: &DbConnection, profile: Profile) -> Result<i64, String> {
    super::repository::insert_profile(db, profile)
}

pub fn get_profile(db: &DbConnection, id: i64) -> Result<Option<ProfileWithId>, String> {
    super::repository::get_profile_by_id(db, id)
}

