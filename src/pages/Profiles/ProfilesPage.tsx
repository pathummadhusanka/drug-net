import { useEffect, useState } from "react";
import { columns, DrugDealer } from "./columns";
import { DataTable } from "./data-table";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";

type ProfileFromDb = {
	id: number;
	full_name: string;
	alias: string | null;
	city: string | null;
	risk_level: string | null;
	status: string | null;
};

export default function Profiles() {
	const [data, setData] = useState<DrugDealer[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchProfiles = async () => {
			try {
				const profiles =
					await invoke<ProfileFromDb[]>("get_all_profiles");
				setData(
					profiles.map((profile) => ({
						id: profile.id,
						name: profile.full_name,
						alias: profile.alias,
						primaryArea: profile.city,
						risk: profile.risk_level,
						cases: 0,
						status: profile.status,
					})),
				);
			} catch (err) {
				console.error("Failed to fetch profiles:", err);
				setData([]);
			}
		};

		void fetchProfiles();
	}, []);

	return (
		<div className="container mx-auto">
			<div className="flex justify-end mb-4">
				<Button
					onClick={() => navigate(`new-profile/`)}
					variant="outline"
					className="cursor-pointer"
				>
					<Plus className="h-4 w-4 mr-2" />
					Add Profile
				</Button>
			</div>
			<DataTable columns={columns} data={data} />
		</div>
	);
}
