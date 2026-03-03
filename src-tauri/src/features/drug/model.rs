use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Drug {
    pub id: i64,
    pub name: String,
    pub quantified_by: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaseDrugData {
    pub drug_id: i64,
    pub quantity: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaseDrugWithDetails {
    pub drug_id: i64,
    pub drug_name: String,
    pub quantified_by: String,
    pub quantity: String,
}
