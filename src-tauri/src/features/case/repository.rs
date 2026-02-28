use rusqlite::params;
use crate::database::connection::DbConnection;
use super::model::{Case, CaseWithDetails};

fn generate_cno(db: &DbConnection) -> Result<String, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Get the count of existing cases to generate the next case number
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM cases", [], |row| row.get(0))
        .map_err(|e| format!("Failed to count cases: {}", e))?;

    // Generate CNO as C + 6-digit zero-padded number (e.g., C000001)
    let next_number = count + 1;
    Ok(format!("C{:06}", next_number))
}

pub fn insert_case(db: &DbConnection, case: Case) -> Result<i64, String> {
    let cno = generate_cno(db)?;
    
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    conn.execute(
        "INSERT INTO cases (cno, case_id, case_name)
        VALUES (?1, ?2, ?3)",
        params![
            cno,
            case.case_id,
            case.case_name,
        ],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(conn.last_insert_rowid())
}

pub fn get_case_by_id(db: &DbConnection, id: i64) -> Result<Option<CaseWithDetails>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT id, cno, case_id, case_name, created_at 
         FROM cases 
         WHERE id = ?1"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let case = stmt.query_row(params![id], |row| {
        Ok(CaseWithDetails {
            id: row.get(0)?,
            cno: row.get(1)?,
            case_id: row.get(2)?,
            case_name: row.get(3)?,
            created_at: row.get(4)?,
        })
    });

    match case {
        Ok(c) => Ok(Some(c)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

pub fn get_all_cases(db: &DbConnection) -> Result<Vec<CaseWithDetails>, String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT id, cno, case_id, case_name, created_at 
         FROM cases 
         ORDER BY created_at DESC"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let cases = stmt.query_map([], |row| {
        Ok(CaseWithDetails {
            id: row.get(0)?,
            cno: row.get(1)?,
            case_id: row.get(2)?,
            case_name: row.get(3)?,
            created_at: row.get(4)?,
        })
    })
    .map_err(|e| format!("Query error: {}", e))?
    .collect::<Result<Vec<CaseWithDetails>, _>>()
    .map_err(|e| format!("Failed to collect results: {}", e))?;

    Ok(cases)
}
