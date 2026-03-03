use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkNodePosition {
    pub profile_id: i64,
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkNodePositionInput {
    pub profile_id: i64,
    pub x: f64,
    pub y: f64,
}