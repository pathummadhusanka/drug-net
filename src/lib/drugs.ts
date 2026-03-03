// Drug API Functions
import { invoke } from "@tauri-apps/api/core";

export interface Drug {
	id: number;
	name: string;
	quantified_by: string;
}

export interface CaseDrugData {
	drug_id: number;
	quantity: string;
}

export interface CaseDrugWithDetails {
	drug_id: number;
	drug_name: string;
	quantified_by: string;
	quantity: string;
}

/**
 * Get all drugs from the database
 * @returns Array of all drugs with their quantification units
 */
export async function getAllDrugs(): Promise<Drug[]> {
	return await invoke<Drug[]>("get_all_drugs");
}

/**
 * Save drugs associated with a case
 * @param caseId - The case ID
 * @param drugs - Array of drugs with quantities
 */
export async function saveCaseDrugs(
	caseId: number,
	drugs: CaseDrugData[],
): Promise<void> {
	return await invoke<void>("save_case_drugs", {
		caseId,
		drugs,
	});
}

/**
 * Get all drugs for a specific case
 * @param caseId - The case ID
 * @returns Array of drugs with details and quantities
 */
export async function getCaseDrugs(
	caseId: number,
): Promise<CaseDrugWithDetails[]> {
	return await invoke<CaseDrugWithDetails[]>("get_case_drugs", {
		caseId,
	});
}

/**
 * Add a new drug to the database
 * @param name - Drug name
 * @param quantifiedBy - Unit of measurement (e.g., "grams", "pills")
 * @returns The ID of the newly created drug
 */
export async function addDrug(
	name: string,
	quantifiedBy: string,
): Promise<number> {
	return await invoke<number>("add_drug", {
		name,
		quantifiedBy,
	});
}

/**
 * Delete a drug from the database
 * @param drugId - The drug ID to delete
 * @throws Error if drug is in use by any case
 */
export async function deleteDrug(drugId: number): Promise<void> {
	return await invoke<void>("delete_drug", {
		drugId,
	});
}

/**
 * Check if a drug is currently used in any case
 * @param drugId - The drug ID to check
 * @returns True if drug is in use, false otherwise
 */
export async function isDrugInUse(drugId: number): Promise<boolean> {
	return await invoke<boolean>("is_drug_in_use", {
		drugId,
	});
}
