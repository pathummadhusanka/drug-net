"use client";

import { ColumnDef } from "@tanstack/react-table";

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
		cell: ({ row }) => row.original.risk || "-",
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
