import { useEffect, useState } from "react";
import { columns, DrugDealer } from "./columns";
import { DataTable } from "./data-table";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getData(): Promise<DrugDealer[]> {
	return [
		{
			id: "1",
			name: "Nimal Perera",
			alias: "Black Fox",
			primaryArea: "Colombo Central",
			risk: "High",
			cases: 3,
			status: "Under Surveillance",
		},
		{
			id: "2",
			name: "Sunil Fernando",
			alias: "Tiger",
			primaryArea: "Gampaha",
			risk: "Medium",
			cases: 1,
			status: "Active",
		},
		{
			id: "3",
			name: "Ruwan Silva",
			alias: "Doctor",
			primaryArea: "Negombo",
			risk: "Low",
			cases: 0,
			status: "Inactive",
		},
		{
			id: "4",
			name: "Ajith Kumara",
			alias: "Shadow",
			primaryArea: "Kandy",
			risk: "High",
			cases: 5,
			status: "Active",
		},
	];
}

export default function Profiles() {
	const [data, setData] = useState<DrugDealer[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		getData().then(setData);
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
