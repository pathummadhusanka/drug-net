// Case API Functions
import { invoke } from "@tauri-apps/api/core";

export interface Case {
	case_id: string | null;
	case_name: string;
	description?: string | null;
	case_type?: string | null;
	status?: string | null;
	severity_level?: string | null;
	notes?: string | null;
	case_date?: string | null;
	case_time?: string | null;
}

export interface CaseWithDetails {
	id: number;
	cno: string;
	case_id: string | null;
	case_name: string;
	description: string | null;
	case_type: string | null;
	status: string | null;
	severity_level: string | null;
	notes: string | null;
	case_date: string | null;
	case_time: string | null;
	created_at: string | null;
	updated_at: string | null;
}

export interface CaseRelationshipData {
	source_profile_id: number;
	target_profile_id: number;
	relationship_type: string | null;
}

/**
 * Create a new case in the database
 * CNO (Case Number) is automatically generated
 * @param caseData - The case data to create
 * @returns The ID of the created case
 */
export async function createCase(caseData: Case): Promise<number> {
	return await invoke<number>("create_case", { case: caseData });
}

/**
 * Update an existing case
 * @param id - The case ID to update
 * @param caseData - The updated case data
 */
export async function updateCase(id: number, caseData: Case): Promise<void> {
	return await invoke<void>("update_case", { id, case: caseData });
}

/**
 * Get a case by its ID
 * @param id - The case ID
 * @returns The case if found, null otherwise
 */
export async function getCase(id: number): Promise<CaseWithDetails | null> {
	return await invoke<CaseWithDetails | null>("get_case", { id });
}

/**
 * Get all cases from the database
 * @returns Array of all cases, sorted by creation date (newest first)
 */
export async function getAllCases(): Promise<CaseWithDetails[]> {
	return await invoke<CaseWithDetails[]>("get_all_cases");
}

/**
 * Search cases in the database by case number, case ID, title, or notes.
 * @param query - Search text
 * @returns Matching cases, newest first
 */
export async function searchCases(query: string): Promise<CaseWithDetails[]> {
	return await invoke<CaseWithDetails[]>("search_cases", { query });
}

/**
 * Link a case to a profile
 * @param caseId - The case ID
 * @param profileId - The profile ID
 */
export async function assignCaseToProfile(
	caseId: number,
	profileId: number,
): Promise<void> {
	return await invoke<void>("assign_case_to_profile", {
		caseId,
		profileId,
	});
}

/**
 * Get all cases for a specific profile
 * @param profileId - The profile ID
 * @returns Array of cases associated with the profile
 */
export async function getProfileCases(
	profileId: number,
): Promise<CaseWithDetails[]> {
	return await invoke<CaseWithDetails[]>("get_profile_cases", {
		profileId,
	});
}

/**
 * Link a case to an area
 * @param caseId - The case ID
 * @param areaId - The area ID
 */
export async function linkCaseToArea(
	caseId: number,
	areaId: number,
): Promise<void> {
	return await invoke<void>("link_case_to_area", {
		caseId,
		areaId,
	});
}

/**
 * Get all areas associated with a case
 * @param caseId - The case ID
 * @returns Array of area names
 */
export async function getCaseAreas(caseId: number): Promise<string[]> {
	return await invoke<string[]>("get_case_areas", { caseId });
}

/**
 * Save relationships (edges) for a case
 * @param caseId - The case ID
 * @param relationships - Array of relationship data to save
 */
export async function saveCaseRelationships(
	caseId: number,
	relationships: CaseRelationshipData[],
): Promise<void> {
	return await invoke<void>("save_case_relationships", {
		caseId,
		relationships,
	});
}

/**
 * Get all relationships (edges) for a case
 * @param caseId - The case ID
 * @returns Array of relationship data
 */
export async function getCaseRelationships(
	caseId: number,
): Promise<CaseRelationshipData[]> {
	return await invoke<CaseRelationshipData[]>("get_case_relationships", {
		caseId,
	});
}

/**
 * Delete a case from the database
 * @param caseId - The case ID to delete
 */
export async function deleteCase(caseId: number): Promise<void> {
	return await invoke<void>("delete_case", {
		caseId,
	});
}

/**
 * Get all profiles associated with a case
 * @param caseId - The case ID
 * @returns Array of tuples: [profile_id, profile_name]
 */
export async function getCaseProfiles(
	caseId: number,
): Promise<[number, string][]> {
	return await invoke<[number, string][]>("get_case_profiles", {
		caseId,
	});
}

/**
 * Load a case with its complete network (profiles, relationships)
 * This retrieves all profiles and relationships associated with a case
 * @param caseId - The case ID
 * @returns Object containing case details, profiles (nodes), and relationships (edges)
 */
export async function getCaseWithNetwork(caseId: number): Promise<{
	caseData: CaseWithDetails | null;
	profileIds: number[];
	relationships: CaseRelationshipData[];
} | null> {
	try {
		// Get case details
		const caseData = await getCase(caseId);
		if (!caseData) {
			return null;
		}

		// Get all relationships for the case
		const relationships = await getCaseRelationships(caseId);

		// Build a set of all unique profile IDs from relationships
		const profileIds = new Set<number>();
		relationships.forEach((rel) => {
			profileIds.add(rel.source_profile_id);
			profileIds.add(rel.target_profile_id);
		});

		return {
			caseData,
			profileIds: Array.from(profileIds),
			relationships,
		};
	} catch (error) {
		console.error("Failed to load case with network:", error);
		return null;
	}
}

/**
 * Helper function to create a case with areas
 * This will:
 * 1. Create the case
 * 2. Create each area (or get existing)
 * 3. Link all areas to the case
 *
 * @param caseData - The case data
 * @param areaNames - Array of area names to associate
 * @returns The created case ID
 */
export async function createCaseWithAreas(
	caseData: Case,
	areaNames: string[],
): Promise<number> {
	// Import here to avoid circular dependency
	const { createArea } = await import("./areas");

	// 1. Create the case
	const caseId = await createCase(caseData);

	// 2. Create/get each area and link to case
	for (const areaName of areaNames) {
		if (areaName.trim()) {
			const areaId = await createArea({ name: areaName.trim() });
			await linkCaseToArea(caseId, areaId);
		}
	}

	return caseId;
}
