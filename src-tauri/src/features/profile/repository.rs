use rusqlite::{params};
use crate::database::connection::get_connection;
use super::model::Person;

pub fn get_by_id(id: i64) -> Result<Person, String> {
    let conn = get_connection()?;

    let mut stmt = conn
        .prepare("SELECT id, full_name, alias FROM persons WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let person = stmt
        .query_row(params![id], |row| {
            Ok(Person {
                id: row.get(0)?,
                full_name: row.get(1)?,
                alias: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(person)
}
