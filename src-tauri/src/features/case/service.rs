use crate::database::connection::DbConnection;
use super::model::{Case, CaseWithDetails, CaseRelationshipData};


pub fn create_case(db: &DbConnection, case: Case) -> Result<i64, String> {
    super::repository::insert_case(db, case)
}

pub fn get_case(db: &DbConnection, id: i64) -> Result<Option<CaseWithDetails>, String> {
    super::repository::get_case_by_id(db, id)
}

pub fn list_cases(db: &DbConnection) -> Result<Vec<CaseWithDetails>, String> {
    super::repository::get_all_cases(db)
}

pub fn assign_case_to_profile(
    db: &DbConnection,
    case_id: i64,
    profile_id: i64,
) -> Result<(), String> {
    super::repository::link_case_to_profile(db, case_id, profile_id)
}

pub fn list_cases_by_profile(
    db: &DbConnection,
    profile_id: i64,
) -> Result<Vec<CaseWithDetails>, String> {
    super::repository::get_cases_by_profile_id(db, profile_id)
}

pub fn assign_case_to_area(
    db: &DbConnection,
    case_id: i64,
    area_id: i64,
) -> Result<(), String> {
    super::repository::link_case_to_area(db, case_id, area_id)
}

pub fn get_areas_for_case(
    db: &DbConnection,
    case_id: i64,
) -> Result<Vec<String>, String> {
    super::repository::get_case_areas(db, case_id)
}
pub fn save_case_relationships(
    db: &DbConnection,
    case_id: i64,
    relationships: Vec<CaseRelationshipData>,
) -> Result<(), String> {
    super::repository::save_case_relationships(db, case_id, relationships)
}

pub fn get_case_relationships(
    db: &DbConnection,
    case_id: i64,
) -> Result<Vec<CaseRelationshipData>, String> {
    super::repository::get_case_relationships(db, case_id)
}

pub fn delete_case(db: &DbConnection, case_id: i64) -> Result<(), String> {
    super::repository::delete_case(db, case_id)
}

pub fn get_case_profiles(db: &DbConnection, case_id: i64) -> Result<Vec<(i64, String)>, String> {
    super::repository::get_case_profiles(db, case_id)
}