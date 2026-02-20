use crate::database::connection::DbConnection;
use super::model::Profile;

pub fn create_profile(db: &DbConnection, profile: Profile) -> Result<i64, String> {
    super::repository::insert_profile(db, profile)
}
