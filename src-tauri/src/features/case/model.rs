use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Case {
    pub case_id: Option<String>,
    pub case_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CaseWithDetails {
    pub id: i64,
    pub cno: String,
    pub case_id: Option<String>,
    pub case_name: String,
    pub created_at: Option<String>,
}
