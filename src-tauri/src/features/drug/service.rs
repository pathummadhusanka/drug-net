use crate::database::connection::DbConnection;
use super::model::{Drug, CaseDrugData, CaseDrugWithDetails};

pub fn list_drugs(db: &DbConnection) -> Result<Vec<Drug>, String> {
    super::repository::get_all_drugs(db)
}

pub fn save_case_drugs(
    db: &DbConnection,
    case_id: i64,
    drugs: Vec<CaseDrugData>,
) -> Result<(), String> {
    super::repository::save_case_drugs(db, case_id, drugs)
}

pub fn get_case_drugs(
    db: &DbConnection,
    case_id: i64,
) -> Result<Vec<CaseDrugWithDetails>, String> {
    super::repository::get_case_drugs(db, case_id)
}
