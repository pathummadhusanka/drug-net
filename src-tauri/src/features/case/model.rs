use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Case {
    pub case_id: Option<String>,
    pub case_name: String,
    pub description: Option<String>,
    pub case_type: Option<String>,
    pub status: Option<String>,
    pub severity_level: Option<String>,
    pub notes: Option<String>,
    pub case_date: Option<String>,
    pub case_time: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CaseWithDetails {
    pub id: i64,
    pub cno: String,
    pub case_id: Option<String>,
    pub case_name: String,
    pub description: Option<String>,
    pub case_type: Option<String>,
    pub status: Option<String>,
    pub severity_level: Option<String>,
    pub notes: Option<String>,
    pub case_date: Option<String>,
    pub case_time: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaseRelationshipData {
    pub source_profile_id: i64,
    pub target_profile_id: i64,
    pub relationship_type: Option<String>,
}