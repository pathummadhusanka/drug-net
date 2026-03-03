// Area API Functions
// Use these functions to interact with the areas database table

import { invoke } from "@tauri-apps/api/core";

export interface Area {
	id: number;
	name: string;
}

export interface NewArea {
	name: string;
}

/**
 * Create a new area in the database
 * If an area with the same name already exists, returns the existing area's ID
 * @param area - The area to create
 * @returns The ID of the created or existing area
 */
export async function createArea(area: NewArea): Promise<number> {
	return await invoke<number>("create_area", { area });
}

/**
 * Get an area by its ID
 * @param id - The area ID
 * @returns The area if found, null otherwise
 */
export async function getArea(id: number): Promise<Area | null> {
	return await invoke<Area | null>("get_area", { id });
}

/**
 * Get an area by its name
 * @param name - The area name
 * @returns The area if found, null otherwise
 */
export async function getAreaByName(name: string): Promise<Area | null> {
	return await invoke<Area | null>("get_area_by_name", { name });
}

/**
 * Get all areas from the database
 * @returns Array of all areas, sorted alphabetically by name
 */
export async function getAllAreas(): Promise<Area[]> {
	return await invoke<Area[]>("get_all_areas");
}

/**
 * Delete an area from the database
 * @param id - The ID of the area to delete
 */
export async function deleteArea(id: number): Promise<void> {
	return await invoke<void>("delete_area", { id });
}

// Example usage:
/*
import { createArea, getAllAreas } from './api/areas';

// Create a new area
const areaId = await createArea({ name: "Colombo" });
console.log("Created area with ID:", areaId);

// Get all areas
const areas = await getAllAreas();
console.log("All areas:", areas);

// Create another area (will reuse if exists)
const areaId2 = await createArea({ name: "Colombo" }); // Returns same ID as above
console.log("Area ID:", areaId2);
*/
