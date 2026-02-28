import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { FileCaseModal } from "../NewProfile/FileCaseModal";

const dummyCases = [
	{
		id: "C-2026-001",
		title: "Harbor Route Distribution",
		leadOfficer: "P. Jayasinghe",
		status: "Open",
		priority: "High",
		updatedAt: "2026-02-25",
	},
	{
		id: "C-2026-002",
		title: "Urban Cell Monitoring",
		leadOfficer: "S. Fernando",
		status: "Under Review",
		priority: "Medium",
		updatedAt: "2026-02-21",
	},
	{
		id: "C-2026-003",
		title: "Cross-District Supply Chain",
		leadOfficer: "R. Perera",
		status: "Open",
		priority: "High",
		updatedAt: "2026-02-19",
	},
	{
		id: "C-2026-004",
		title: "Local Storage Unit Raid",
		leadOfficer: "N. Silva",
		status: "Closed",
		priority: "Low",
		updatedAt: "2026-02-12",
	},
];

export default function CasesPage() {
	const openCount = dummyCases.filter((caseItem) => caseItem.status === "Open").length;
	const reviewCount = dummyCases.filter((caseItem) => caseItem.status === "Under Review").length;
	const closedCount = dummyCases.filter((caseItem) => caseItem.status === "Closed").length;

	return (
		<div className="container mx-auto space-y-4">
			<div className="flex justify-end items-center">
				<FileCaseModal />
			</div>

			<div className="grid gap-4 grid-cols-1 md:grid-cols-3">
				<Card>
					<CardContent className="py-1">
						<p className="text-sm font-medium">Open Cases: <span className="font-semibold">{openCount}</span></p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="py-1">
						<p className="text-sm font-medium">Under Review: <span className="font-semibold">{reviewCount}</span></p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="py-1">
						<p className="text-sm font-medium">Closed Cases: <span className="font-semibold">{closedCount}</span></p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-base font-semibold">Recent Cases</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Case ID</TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Lead Officer</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Priority</TableHead>
								<TableHead>Last Updated</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{dummyCases.map((caseItem) => (
								<TableRow key={caseItem.id}>
									<TableCell className="font-medium">{caseItem.id}</TableCell>
									<TableCell>{caseItem.title}</TableCell>
									<TableCell>{caseItem.leadOfficer}</TableCell>
									<TableCell>{caseItem.status}</TableCell>
									<TableCell>{caseItem.priority}</TableCell>
									<TableCell>{caseItem.updatedAt}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
