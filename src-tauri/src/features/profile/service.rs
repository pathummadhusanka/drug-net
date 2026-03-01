use crate::database::connection::DbConnection;
use super::model::{
    Profile,
    ProfileWithId,
    ProfileDrug,
    ProfileArea,
    ProfileRelationship,
};

pub fn create_profile(db: &DbConnection, profile: Profile) -> Result<i64, String> {
    super::repository::insert_profile(db, profile)
}

pub fn update_profile(db: &DbConnection, id: i64, profile: Profile) -> Result<bool, String> {
    super::repository::update_profile_by_id(db, id, profile)
}

pub fn get_profile(db: &DbConnection, id: i64) -> Result<Option<ProfileWithId>, String> {
    super::repository::get_profile_by_id(db, id)
}

pub fn get_profile_drugs(db: &DbConnection, id: i64) -> Result<Vec<ProfileDrug>, String> {
    super::repository::get_profile_drugs(db, id)
}

pub fn get_profile_areas(db: &DbConnection, id: i64) -> Result<Vec<ProfileArea>, String> {
    super::repository::get_profile_areas(db, id)
}

pub fn get_profile_relationships(
    db: &DbConnection,
    id: i64,
) -> Result<Vec<ProfileRelationship>, String> {
    super::repository::get_profile_relationships(db, id)
}

pub fn list_profiles(db: &DbConnection) -> Result<Vec<ProfileWithId>, String> {
    super::repository::get_all_profiles(db)
}

pub fn delete_profile(db: &DbConnection, id: i64) -> Result<bool, String> {
    super::repository::delete_profile_by_id(db, id)
}

