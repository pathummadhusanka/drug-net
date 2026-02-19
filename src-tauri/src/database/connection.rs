use rusqlite::Connection;
use std::path::PathBuf;

pub fn get_connection() -> Result<Connection, String> {
    let mut path = std::env::current_dir().unwrap();
    path.push("drug_net.db");

    Connection::open(path).map_err(|e| e.to_string())
}
