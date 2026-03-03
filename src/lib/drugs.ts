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
