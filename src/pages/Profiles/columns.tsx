"use client";

import { ColumnDef } from "@tanstack/react-table";

export type DrugDealer = {
	id: string;
	name: string;
	alias: string;
	primaryArea: string;
	risk: "High" | "Medium" | "Low";
	cases: number;
	status: "Under Surveillance" | "Active" | "Inactive";
};

export const columns: ColumnDef<DrugDealer>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "alias",
		header: "Alias",
	},
	{
		accessorKey: "primaryArea",
		header: "Primary Area",
	},
	{
		accessorKey: "risk",
		header: "Risk",
	},
	{
		accessorKey: "cases",
		header: "Cases",
	},
	{
		accessorKey: "status",
		header: "Status",
	},
];
