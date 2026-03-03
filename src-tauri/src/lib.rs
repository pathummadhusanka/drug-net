// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod database;
mod features;

use database::connection::{init_connection, DbConnection};
use database::migrations::run_migrations;
use features::area::commands::{
    create_area,
    get_area,
    get_area_by_name,
    get_all_areas,
    delete_area,
};
use features::case::commands::{
    create_case,
    get_case,
    get_all_cases,
    assign_case_to_profile,
    get_profile_cases,
    link_case_to_area,
    get_case_areas,
    save_case_relationships,
    get_case_relationships,
};
use features::drug::commands::{
    get_all_drugs,
    save_case_drugs,
    get_case_drugs,
};
use features::profile::commands::{
    create_profile,
    update_profile,
    get_profile,
    get_profile_drugs,
    get_profile_areas,
    get_profile_relationships,
    get_all_profiles,
    delete_profile,
};

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
        .invoke_handler(tauri::generate_handler![
            greet, 
            create_profile,
            update_profile,
            get_profile,
            get_profile_drugs,
            get_profile_areas,
            get_profile_relationships,
            get_all_profiles,
            delete_profile,
            create_case,
            get_case,
            get_all_cases,
            assign_case_to_profile,
            get_profile_cases,
            link_case_to_area,
            get_case_areas,
            save_case_relationships,
            get_case_relationships,
            get_all_drugs,
            save_case_drugs,
            get_case_drugs,
            create_area,
            get_area,
            get_area_by_name,
            get_all_areas,
            delete_area
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
