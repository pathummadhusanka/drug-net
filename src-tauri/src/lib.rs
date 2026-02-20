// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod database;
mod features;

use database::connection::{init_connection, DbConnection};
use database::migrations::run_migrations;
use features::profile::commands::create_profile;

/// Application state containing shared database connection
pub struct AppState {
    pub db: DbConnection,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database connection
    let db = init_connection()
        .expect("Fatal: Failed to initialize database connection");

    // Run migrations
    run_migrations(&db)
        .expect("Fatal: Database migration failed");

    // Create application state
    let app_state = AppState { db };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![greet, create_profile])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
