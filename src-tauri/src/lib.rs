// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod database;
mod export;
mod features;

use database::connection::{init_connection, DbConnection};
use database::migrations::run_migrations;
use database::operations::reset_database as reset_db_operation;
use features::area::commands::{
    create_area,
    get_area,
    get_area_by_name,
    get_all_areas,
    delete_area,
};
use features::case::commands::{
    create_case,
    update_case,
    get_case,
    get_all_cases,
    search_cases,
    save_case_attachments,
    get_case_attachments,
    assign_case_to_profile,
    get_profile_cases,
    link_case_to_area,
    get_case_areas,
    save_case_relationships,
    get_case_relationships,
    delete_case,
    get_case_profiles,
};
use features::drug::commands::{
    get_all_drugs,
    save_case_drugs,
    get_case_drugs,
    add_drug,
    delete_drug,
    is_drug_in_use,
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
use features::network::commands::{
    get_network_node_positions,
    upsert_network_node_positions,
    sync_network_node_positions,
};

/// Application state containing shared database connection
pub struct AppState {
    pub db: DbConnection,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn reset_database(state: tauri::State<AppState>) -> Result<(), String> {
    reset_db_operation(&state.db)
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
        .plugin(tauri_plugin_dialog::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            reset_database,
            create_profile,
            update_profile,
            get_profile,
            get_profile_drugs,
            get_profile_areas,
            get_profile_relationships,
            get_all_profiles,
            delete_profile,
            create_case,
            update_case,
            get_case,
            get_all_cases,
            search_cases,
            save_case_attachments,
            get_case_attachments,
            assign_case_to_profile,
            get_profile_cases,
            link_case_to_area,
            get_case_areas,
            save_case_relationships,
            get_case_relationships,
            delete_case,
            get_case_profiles,
            get_all_drugs,
            save_case_drugs,
            get_case_drugs,
            add_drug,
            delete_drug,
            is_drug_in_use,
            create_area,
            get_area,
            get_area_by_name,
            get_all_areas,
            delete_area,
            get_network_node_positions,
            upsert_network_node_positions,
            sync_network_node_positions,
            export::export_database
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
