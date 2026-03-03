use rusqlite::params;
use crate::database::connection::DbConnection;
use super::model::{Drug, CaseDrugData, CaseDrugWithDetails};

pub fn get_all_drugs(db: &DbConnection) -> Result<Vec<Drug>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT id, name, quantified_by 
         FROM drugs 
         ORDER BY name ASC"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let drugs = stmt.query_map([], |row| {
        Ok(Drug {
            id: row.get(0)?,
            name: row.get(1)?,
            quantified_by: row.get(2)?,
        })
    })
    .map_err(|e| format!("Query error: {}", e))?
    .collect::<Result<Vec<Drug>, _>>()
    .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(drugs)
}

pub fn save_case_drugs(
    db: &DbConnection,
    case_id: i64,
    drugs: Vec<CaseDrugData>,
) -> Result<(), String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    for drug in drugs {
        conn.execute(
            "INSERT OR REPLACE INTO case_drugs (case_id, drug_id, quantity)
             VALUES (?1, ?2, ?3)",
            params![case_id, drug.drug_id, drug.quantity],
        )
        .map_err(|e| format!("Failed to save case drug: {}", e))?;
    }

    Ok(())
}

pub fn get_case_drugs(
    db: &DbConnection,
    case_id: i64,
) -> Result<Vec<CaseDrugWithDetails>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT cd.drug_id, d.name, d.quantified_by, cd.quantity
         FROM case_drugs cd
         JOIN drugs d ON d.id = cd.drug_id
         WHERE cd.case_id = ?1
         ORDER BY d.name ASC"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let drugs = stmt.query_map(params![case_id], |row| {
        Ok(CaseDrugWithDetails {
            drug_id: row.get(0)?,
            drug_name: row.get(1)?,
            quantified_by: row.get(2)?,
            quantity: row.get(3)?,
        })
    })
    .map_err(|e| format!("Query error: {}", e))?
    .collect::<Result<Vec<CaseDrugWithDetails>, _>>()
    .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(drugs)
}
