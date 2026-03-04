use super::connection::DbConnection;

pub fn reset_database(db: &DbConnection) -> Result<(), String> {
    let conn = db.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;
    
    // Delete all user data but keep the schema
    conn.execute_batch(
        "
        PRAGMA foreign_keys = OFF;
        
        -- Delete all user data
        DELETE FROM network_node_positions;
        DELETE FROM case_drugs;
        DELETE FROM case_relationships;
        DELETE FROM case_areas;
        DELETE FROM case_profiles;
        DELETE FROM cases;
        DELETE FROM relationships;
        DELETE FROM profile_areas;
        DELETE FROM profile_drugs;
        DELETE FROM profiles;
        
        -- Delete custom drugs (keep only initial seeded drugs)
        -- We'll delete all and reseed below
        DELETE FROM drugs;
        
        -- Areas can be deleted as they're user-created
        DELETE FROM areas;
        
        PRAGMA foreign_keys = ON;
        "
    )
    .map_err(|e| format!("Failed to clear database tables: {}", e))?;

    // Re-seed default drugs
    let drugs = vec![
        ("Heroin", "grams"),
        ("Cocaine", "grams"),
        ("Methamphetamine", "grams"),
        ("Cannabis", "grams"),
        ("MDMA (Ecstasy)", "pills"),
        ("LSD", "tabs"),
        ("Fentanyl", "grams"),
        ("Amphetamine", "grams"),
        ("Ketamine", "grams"),
        ("PCP", "grams"),
        ("Morphine", "grams"),
        ("Codeine", "pills"),
        ("Oxycodone", "pills"),
        ("Hydrocodone", "pills"),
        ("Methadone", "mg"),
    ];

    for (name, unit) in drugs {
        conn.execute(
            "INSERT INTO drugs (name, quantified_by) VALUES (?1, ?2)",
            [name, unit],
        )
        .map_err(|e| format!("Failed to seed drug {}: {}", name, e))?;
    }

    Ok(())
}
