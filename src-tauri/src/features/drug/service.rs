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

pub fn add_drug(
    db: &DbConnection,
    name: String,
    quantified_by: String,
) -> Result<i64, String> {
    super::repository::add_drug(db, name, quantified_by)
}

pub fn delete_drug(db: &DbConnection, drug_id: i64) -> Result<(), String> {
    super::repository::delete_drug(db, drug_id)
}

pub fn is_drug_in_use(db: &DbConnection, drug_id: i64) -> Result<bool, String> {
    super::repository::is_drug_in_use(db, drug_id)
}
