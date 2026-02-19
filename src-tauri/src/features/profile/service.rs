use super::model::Person;
use super::repository;

pub fn get_person(id: i64) -> Result<Person, String> {
    repository::get_by_id(id)
}
