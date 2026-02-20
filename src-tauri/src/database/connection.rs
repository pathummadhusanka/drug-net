use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Database connection wrapped in Arc<Mutex> for thread-safe shared access
pub type DbConnection = Arc<Mutex<Connection>>;

/// Get the database file path based on environment
fn get_db_path() -> Result<PathBuf, String> {
    // Check if we're in development mode
    let is_dev = cfg!(debug_assertions);
    
    if is_dev {
        // Development: Store in project root for easy inspection
        let path = std::env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?;
        Ok(path.join("drug_net.db"))
    } else {
        // Production: Store in OS app data directory
        let app_data = std::env::var("APPDATA")
            .or_else(|_| std::env::var("HOME"))
            .map_err(|_| "Failed to get app data directory".to_string())?;
        
        let mut path = PathBuf::from(app_data);
        path.push("DrugNet");
        
        // Ensure directory exists
        if !path.exists() {
            std::fs::create_dir_all(&path)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }
        
        path.push("drug_net.db");
        Ok(path)
    }
}

/// Initialize a new database connection
pub fn init_connection() -> Result<DbConnection, String> {
    let db_path = get_db_path()?;
    
    // Ensure parent directory exists
    if let Some(parent) = db_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create database directory: {}", e))?;
        }
    }
    
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database at {:?}: {}", db_path, e))?;
    
    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;", [])
        .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;
    
    Ok(Arc::new(Mutex::new(conn)))
}
