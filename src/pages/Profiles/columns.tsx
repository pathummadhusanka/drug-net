"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export type DrugDealer = {
	id: number;
	name: string;
	alias: string | null;
	primaryArea: string | null;
	risk: string | null;
	cases: number;
	status: string | null;
};

export const columns: ColumnDef<DrugDealer>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "alias",
		header: "Alias",
		cell: ({ row }) => row.original.alias || "-",
	},
	{
		accessorKey: "primaryArea",
		header: "Primary Area",
		cell: ({ row }) => row.original.primaryArea || "-",
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
		accessorKey: "cases",
		header: "Cases",
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => row.original.status || "-",
	},
];
