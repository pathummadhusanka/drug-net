use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;

use crate::database::connection::get_db_path;

/// Create a zipped export of the application's database file at `dest_path`.
/// If `dest_path` does not end with `.zip`, the extension will be added.
#[tauri::command]
pub fn export_database(dest_path: String) -> Result<String, String> {
    // Resolve destination path and ensure parent exists
    let mut dest = dest_path.clone();
    if !dest.to_lowercase().ends_with(".zip") {
        dest.push_str(".zip");
    }

    let dest_path = Path::new(&dest);
    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create destination directory: {}", e))?;
    }

    // Locate database file
    let db_path = get_db_path().map_err(|e| format!("Failed to determine DB path: {}", e))?;

    // Open DB file and read contents
    let mut db_file = File::open(&db_path)
        .map_err(|e| format!("Failed to open database file {:?}: {}", db_path, e))?;
    let mut buffer = Vec::new();
    db_file
        .read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read database file: {}", e))?;

    // Create zip file and write the DB file inside as 'drug_net.db'
    let zip_file = File::create(&dest_path)
        .map_err(|e| format!("Failed to create zip file {:?}: {}", dest_path, e))?;

    let mut zip = zip::ZipWriter::new(zip_file);
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    zip.start_file("drug_net.db", options)
        .map_err(|e| format!("Failed to start zip entry: {}", e))?;
    zip.write_all(&buffer)
        .map_err(|e| format!("Failed to write to zip: {}", e))?;

    zip.finish()
        .map_err(|e| format!("Failed to finalize zip file: {}", e))?;

    Ok(dest_path.to_string_lossy().to_string())
}
