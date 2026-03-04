use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Profile {
    pub full_name: String,
    pub alias: Option<String>,
    pub nic: Option<String>,
    pub address_line1: Option<String>,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub risk_level: Option<String>,
    pub status: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileWithId {
    pub id: i64,
    pub full_name: String,
    pub alias: Option<String>,
    pub nic: Option<String>,
    pub address_line1: Option<String>,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub risk_level: Option<String>,
    pub status: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileDrug {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileArea {
    pub id: i64,
    pub name: String,
    pub is_primary: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileRelationship {
    pub id: i64,
    pub target_profile_id: i64,
    pub target_full_name: String,
    pub target_alias: Option<String>,
    pub linked_case_id: Option<i64>,
    pub relationship_type: Option<String>,
}

