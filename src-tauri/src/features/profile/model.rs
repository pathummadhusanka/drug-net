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
