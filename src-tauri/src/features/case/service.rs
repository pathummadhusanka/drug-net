use crate::database::connection::DbConnection;
use super::model::{Case, CaseWithDetails, CaseRelationshipData};


pub fn create_case(db: &DbConnection, case: Case) -> Result<i64, String> {
    super::repository::insert_case(db, case)
}

pub fn update_case(db: &DbConnection, id: i64, case: Case) -> Result<(), String> {
    super::repository::update_case(db, id, case)
}

pub fn get_case(db: &DbConnection, id: i64) -> Result<Option<CaseWithDetails>, String> {
    super::repository::get_case_by_id(db, id)
}

pub fn list_cases(db: &DbConnection) -> Result<Vec<CaseWithDetails>, String> {
    super::repository::get_all_cases(db)
}

pub fn search_cases(db: &DbConnection, query: String) -> Result<Vec<CaseWithDetails>, String> {
    super::repository::search_cases(db, query)
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

pub fn save_case_attachments(
    db: &DbConnection,
    case_id: i64,
    attached_case_ids: Vec<i64>,
) -> Result<(), String> {
    super::repository::save_case_attachments(db, case_id, attached_case_ids)
}

pub fn get_case_attachments(
    db: &DbConnection,
    case_id: i64,
) -> Result<Vec<CaseWithDetails>, String> {
    super::repository::get_case_attachments(db, case_id)
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