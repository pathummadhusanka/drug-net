use crate::database::connection::DbConnection;
use super::model::{Area, NewArea};

pub fn create_area(db: &DbConnection, area: NewArea) -> Result<i64, String> {
    super::repository::insert_area(db, area)
}

pub fn get_area(db: &DbConnection, id: i64) -> Result<Option<Area>, String> {
    super::repository::get_area_by_id(db, id)
}

pub fn get_area_by_name(db: &DbConnection, name: &str) -> Result<Option<Area>, String> {
    super::repository::get_area_by_name(db, name)
}

pub fn list_areas(db: &DbConnection) -> Result<Vec<Area>, String> {
    super::repository::get_all_areas(db)
}

pub fn remove_area(db: &DbConnection, id: i64) -> Result<(), String> {
    super::repository::delete_area(db, id)
}
