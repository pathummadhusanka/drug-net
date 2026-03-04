// Profile API Functions
import { invoke } from "@tauri-apps/api/core";

export interface Profile {
	full_name: string;
	alias?: string | null;
	nic?: string | null;
	address_line1?: string | null;
	address_line2?: string | null;
	city?: string | null;
	risk_level?: string | null;
	status?: string | null;
	notes?: string | null;
}

export interface ProfileWithId {
	id: number;
	full_name: string;
	alias: string | null;
	nic: string | null;
	address_line1: string | null;
	address_line2: string | null;
	city: string | null;
	risk_level: string | null;
	status: string | null;
	notes: string | null;
	created_at: string | null;
	updated_at: string | null;
}

export interface ProfileDrug {
	id: number;
	name: string;
}

export interface ProfileArea {
	id: number;
	name: string;
	is_primary: number;
}

export interface ProfileRelationship {
	id: number;
	target_profile_id: number;
	target_full_name: string;
	target_alias: string | null;
	linked_case_id: number | null;
	relationship_type: string | null;
}

/**
 * Create a new profile in the database
 * @param profile - The profile data to create
 * @returns The ID of the created profile
 */
export async function createProfile(profile: Profile): Promise<number> {
	return await invoke<number>("create_profile", { profile });
}

/**
 * Update an existing profile
 * @param id - The profile ID
 * @param profile - The updated profile data
 * @returns True if update was successful
 */
export async function updateProfile(
	id: number,
	profile: Profile,
): Promise<boolean> {
	return await invoke<boolean>("update_profile", { id, profile });
}

/**
 * Get a profile by its ID
 * @param id - The profile ID
 * @returns The profile if found, null otherwise
 */
export async function getProfile(id: number): Promise<ProfileWithId | null> {
	return await invoke<ProfileWithId | null>("get_profile", { id });
}

/**
 * Get all drugs associated with a profile
 * @param id - The profile ID
 * @returns Array of drugs
 */
export async function getProfileDrugs(id: number): Promise<ProfileDrug[]> {
	return await invoke<ProfileDrug[]>("get_profile_drugs", { id });
}

/**
 * Get all areas associated with a profile
 * @param id - The profile ID
 * @returns Array of areas
 */
export async function getProfileAreas(id: number): Promise<ProfileArea[]> {
	return await invoke<ProfileArea[]>("get_profile_areas", { id });
}

/**
 * Get all relationships for a profile
 * @param id - The profile ID
 * @returns Array of relationships
 */
export async function getProfileRelationships(
	id: number,
): Promise<ProfileRelationship[]> {
	return await invoke<ProfileRelationship[]>("get_profile_relationships", {
		id,
	});
}

/**
 * Get all profiles from the database
 * @returns Array of all profiles
 */
export async function getAllProfiles(): Promise<ProfileWithId[]> {
	return await invoke<ProfileWithId[]>("get_all_profiles");
}

/**
 * Delete a profile from the database
 * @param id - The ID of the profile to delete
 * @returns True if deletion was successful
 */
export async function deleteProfile(id: number): Promise<boolean> {
	return await invoke<boolean>("delete_profile", { id });
}
