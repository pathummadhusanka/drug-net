// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod database;
mod features;

use database::connection::get_connection;
use database::migrations::run_migrations;
use features::profile::commands::get_person_by_id;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    // Initialize database and run migrations
    let conn = get_connection().expect("Failed to open DB");
    run_migrations(&conn).expect("Migration failed");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_person_by_id])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
