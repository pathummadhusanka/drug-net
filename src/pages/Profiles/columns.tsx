"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

const truncateText = (
	text: string | null | undefined,
	maxLength: number = 20,
): string => {
	if (!text) return "";
	if (text.length > maxLength) {
		return text.substring(0, maxLength) + "...";
	}
	return text;
};

export type DrugDealer = {
	id: number;
	name: string;
	alias: string | null;
	primaryArea: string | null;
	risk: string | null;
	cases: number;
	status: string | null;
	caseAreas: string[];
	recentCaseArea: string | null;
	caseDrugs: string[];
	recentCaseDrug: string | null;
	connections: number;
};

export const columns: ColumnDef<DrugDealer>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => truncateText(row.original.name),
	},
	{
		accessorKey: "alias",
		header: "Alias",
		cell: ({ row }) => truncateText(row.original.alias) || "-",
	},
	{
		accessorKey: "recentCaseArea",
		header: "Areas",
		cell: ({ row }) => {
			const recentArea = row.original.recentCaseArea;
			const totalAreas = row.original.caseAreas.length;
			const additionalCount = totalAreas - 1;

			if (!recentArea) {
				return "-";
			}

			return (
				<div className="flex items-center gap-2">
					<span>{truncateText(recentArea)}</span>
					{additionalCount > 0 && (
						<span className="text-xs text-muted-foreground">
							+{additionalCount}
						</span>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: "recentCaseDrug",
		header: "Drugs",
		cell: ({ row }) => {
			const recentDrug = row.original.recentCaseDrug;
			const totalDrugs = row.original.caseDrugs.length;
			const additionalCount = totalDrugs - 1;

			if (!recentDrug) {
				return "-";
			}

			return (
				<div className="flex items-center gap-2">
					<span>{truncateText(recentDrug)}</span>
					{additionalCount > 0 && (
						<span className="text-xs text-muted-foreground">
							+{additionalCount}
						</span>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: "connections",
		header: "Connections",
	},
	{
		accessorKey: "cases",
		header: "Cases",
	},
	{
		accessorKey: "risk",
		header: "Risk",
		cell: ({ row }) =>
			row.original.risk ? (
				<Badge
					variant={
						row.original.risk === "Low"
							? "secondary"
							: row.original.risk === "Medium"
								? "default"
								: "destructive"
					}
					className={row.original.risk === "High" ? "text-white" : ""}
				>
					{row.original.risk}
				</Badge>
			) : (
				"-"
			),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => truncateText(row.original.status) || "-",
	},
];
