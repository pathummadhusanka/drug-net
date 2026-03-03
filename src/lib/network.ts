import { invoke } from "@tauri-apps/api/core";

export interface NetworkNodePosition {
	profile_id: number;
	x: number;
	y: number;
}

export async function getNetworkNodePositions(): Promise<
	NetworkNodePosition[]
> {
	return await invoke<NetworkNodePosition[]>("get_network_node_positions");
}

export async function upsertNetworkNodePositions(
	positions: NetworkNodePosition[],
): Promise<void> {
	return await invoke<void>("upsert_network_node_positions", {
		positions,
	});
}

export async function syncNetworkNodePositions(
	profileIds: number[],
): Promise<void> {
	return await invoke<void>("sync_network_node_positions", {
		profileIds,
	});
}
