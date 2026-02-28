use crate::database::connection::DbConnection;
use super::model::{Case, CaseWithDetails};

pub fn create_case(db: &DbConnection, case: Case) -> Result<i64, String> {
    super::repository::insert_case(db, case)
}

pub fn get_case(db: &DbConnection, id: i64) -> Result<Option<CaseWithDetails>, String> {
    super::repository::get_case_by_id(db, id)
}

pub fn list_cases(db: &DbConnection) -> Result<Vec<CaseWithDetails>, String> {
    super::repository::get_all_cases(db)
}
