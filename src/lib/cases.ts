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
