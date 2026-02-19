use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Person {
    pub id: i64,
    pub full_name: String,
    pub alias: Option<String>,
}
