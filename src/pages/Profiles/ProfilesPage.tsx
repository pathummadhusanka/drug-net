import { useEffect, useMemo, useState } from "react";
import { columns, DrugDealer } from "./columns";
import { DataTable } from "./data-table";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { invoke } from "@tauri-apps/api/core";
import { getAllAreas } from "@/lib/areas";

type ProfileFromDb = {
	id: number;
	full_name: string;
	alias: string | null;
	city: string | null;
	risk_level: string | null;
	status: string | null;
	created_at?: string | null;
	updated_at?: string | null;
};

type ProfileRow = DrugDealer & {
	createdAt: string | null;
	updatedAt: string | null;
};

export default function Profiles() {
	const [data, setData] = useState<ProfileRow[]>([]);
	const [allAreas, setAllAreas] = useState<string[]>([]);
	const [searchText, setSearchText] = useState("");
	const [filterRisk, setFilterRisk] = useState("All Risks");
	const [filterStatus, setFilterStatus] = useState("All Statuses");
	const [filterArea, setFilterArea] = useState("All Areas");
	const [sortBy, setSortBy] = useState("name-asc");
	const navigate = useNavigate();

	const ALL_RISKS_FILTER_VALUE = "All Risks";
	const ALL_STATUSES_FILTER_VALUE = "All Statuses";
	const ALL_AREAS_FILTER_VALUE = "All Areas";
	const ALL_RISK_LEVELS = [
		{ value: "low", label: "Low" },
		{ value: "medium", label: "Medium" },
		{ value: "high", label: "High" },
	];
	const ALL_PROFILE_STATUSES = [
		{ value: "active", label: "Active" },
		{ value: "inactive", label: "Inactive" },
		{ value: "suspended", label: "Suspended" },
	];

	const formatLabel = (value: string) => {
		return value
			.split(/[\s_-]+/)
			.filter(Boolean)
			.map(
				(part) =>
					part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
			)
			.join(" ");
	};

	useEffect(() => {
		const fetchProfiles = async () => {
			try {
				const [profiles, areas] = await Promise.all([
					invoke<ProfileFromDb[]>("get_all_profiles"),
					getAllAreas(),
				]);
				setData(
					profiles.map((profile) => ({
						id: profile.id,
						name: profile.full_name,
						alias: profile.alias,
						primaryArea: profile.city,
						risk: profile.risk_level,
						cases: 0,
						status: profile.status,
						createdAt: profile.created_at ?? null,
						updatedAt: profile.updated_at ?? null,
					})),
				);
				setAllAreas(
					areas
						.map((area) => area.name)
						.filter((name) => name && name.trim().length > 0),
				);
			} catch (err) {
				console.error("Failed to fetch profiles:", err);
				setData([]);
				setAllAreas([]);
			}
		};

		void fetchProfiles();
	}, []);

	const riskOptions = useMemo(() => {
		const riskCounts = data.reduce<Record<string, number>>((acc, row) => {
			const key = (row.risk || "").trim().toLowerCase();
			if (!key) return acc;
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {});

		return ALL_RISK_LEVELS.map((risk) => ({
			...risk,
			count: riskCounts[risk.value] || 0,
		}));
	}, [data]);

	const statusOptions = useMemo(() => {
		const statusCounts = data.reduce<Record<string, number>>((acc, row) => {
			const key = (row.status || "").trim().toLowerCase();
			if (!key) return acc;
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {});

		return ALL_PROFILE_STATUSES.map((status) => ({
			...status,
			count: statusCounts[status.value] || 0,
		}));
	}, [data]);

	const areaOptions = useMemo(() => {
		const areaCounts = data.reduce<Record<string, number>>((acc, row) => {
			const key = (row.primaryArea || "").trim().toLowerCase();
			if (!key) return acc;
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {});

		const combinedAreaNames = Array.from(
			new Set([
				...allAreas,
				...data
					.map((row) => row.primaryArea)
					.filter((area): area is string =>
						Boolean(area && area.trim().length > 0),
					),
			]),
		);

		return combinedAreaNames
			.map((name) => {
				const value = name.trim().toLowerCase();
				return {
					value,
					label: formatLabel(name),
					count: areaCounts[value] || 0,
				};
			})
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [data, allAreas]);

	const selectedRiskValue = useMemo(() => {
		return riskOptions.find((option) => option.label === filterRisk)?.value;
	}, [riskOptions, filterRisk]);

	const selectedStatusValue = useMemo(() => {
		return statusOptions.find((option) => option.label === filterStatus)
			?.value;
	}, [statusOptions, filterStatus]);

	const selectedAreaValue = useMemo(() => {
		return areaOptions.find((option) => option.label === filterArea)?.value;
	}, [areaOptions, filterArea]);

	const hasActiveFilters =
		searchText.trim() !== "" ||
		filterRisk !== ALL_RISKS_FILTER_VALUE ||
		filterStatus !== ALL_STATUSES_FILTER_VALUE ||
		filterArea !== ALL_AREAS_FILTER_VALUE;

	const isRiskFilterActive = filterRisk !== ALL_RISKS_FILTER_VALUE;
	const isStatusFilterActive = filterStatus !== ALL_STATUSES_FILTER_VALUE;
	const isAreaFilterActive = filterArea !== ALL_AREAS_FILTER_VALUE;

	const resetFilters = () => {
		setSearchText("");
		setFilterRisk(ALL_RISKS_FILTER_VALUE);
		setFilterStatus(ALL_STATUSES_FILTER_VALUE);
		setFilterArea(ALL_AREAS_FILTER_VALUE);
		setSortBy("name-asc");
	};

	const visibleProfiles = useMemo(() => {
		const query = searchText.trim().toLowerCase();

		const getRowTimestamp = (row: ProfileRow) => {
			const source = row.updatedAt || row.createdAt;
			if (!source) return 0;
			const ts = new Date(source).getTime();
			return Number.isNaN(ts) ? 0 : ts;
		};

		const filtered = data.filter((row) => {
			if (
				filterRisk !== ALL_RISKS_FILTER_VALUE &&
				(row.risk || "").trim().toLowerCase() !== selectedRiskValue
			) {
				return false;
			}

			if (
				filterStatus !== ALL_STATUSES_FILTER_VALUE &&
				(row.status || "").trim().toLowerCase() !== selectedStatusValue
			) {
				return false;
			}

			if (
				filterArea !== ALL_AREAS_FILTER_VALUE &&
				(row.primaryArea || "").trim().toLowerCase() !==
					selectedAreaValue
			) {
				return false;
			}

			if (!query) return true;

			const searchable = [
				row.name,
				row.alias,
				row.primaryArea,
				row.risk,
				row.status,
			]
				.filter(Boolean)
				.map((field) => String(field).toLowerCase());

			return searchable.some((field) => field.includes(query));
		});

		return [...filtered].sort((a, b) => {
			switch (sortBy) {
				case "name-desc":
					return (b.name || "").localeCompare(a.name || "");
				case "updated-asc":
					return getRowTimestamp(a) - getRowTimestamp(b);
				case "updated-desc":
					return getRowTimestamp(b) - getRowTimestamp(a);
				case "name-asc":
				default:
					return (a.name || "").localeCompare(b.name || "");
			}
		});
	}, [
		data,
		searchText,
		filterRisk,
		filterStatus,
		filterArea,
		selectedRiskValue,
		selectedStatusValue,
		selectedAreaValue,
		sortBy,
		ALL_RISKS_FILTER_VALUE,
		ALL_STATUSES_FILTER_VALUE,
		ALL_AREAS_FILTER_VALUE,
	]);

	return (
		<div className="container mx-auto">
			<div className="flex justify-end mb-4">
				<Button
					onClick={() => navigate(`new-profile/`)}
					variant="secondary"
					className="cursor-pointer"
				>
					<UserPlus className="h-4 w-4 mr-2" />
					Add Profile
				</Button>
			</div>

			<div className="flex flex-col gap-3 mb-4">
				<div className="flex gap-3">
					<Input
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						placeholder="Search by name, alias, area, risk, status..."
						className="flex-1"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<Combobox
						value={filterRisk}
						onValueChange={(value) =>
							setFilterRisk(value || ALL_RISKS_FILTER_VALUE)
						}
					>
						<ComboboxInput
							placeholder="All Risks"
							aria-label="Filter by risk"
							className={
								isRiskFilterActive
									? "border-blue-500 ring-1 ring-blue-500/20"
									: ""
							}
						/>
						<ComboboxContent>
							<ComboboxList>
								<ComboboxItem value={ALL_RISKS_FILTER_VALUE}>
									<div className="flex items-center justify-between w-full">
										<span>All Risks</span>
										<span className="text-xs text-muted-foreground">
											{data.length}
										</span>
									</div>
								</ComboboxItem>
								{riskOptions.map((option) => (
									<ComboboxItem
										key={option.value}
										value={option.label}
									>
										<div className="flex items-center justify-between w-full">
											<span>{option.label}</span>
											<span className="text-xs text-muted-foreground">
												{option.count}
											</span>
										</div>
									</ComboboxItem>
								))}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>

					<Combobox
						value={filterStatus}
						onValueChange={(value) =>
							setFilterStatus(value || ALL_STATUSES_FILTER_VALUE)
						}
					>
						<ComboboxInput
							placeholder="All Statuses"
							aria-label="Filter by status"
							className={
								isStatusFilterActive
									? "border-blue-500 ring-1 ring-blue-500/20"
									: ""
							}
						/>
						<ComboboxContent>
							<ComboboxList>
								<ComboboxItem value={ALL_STATUSES_FILTER_VALUE}>
									<div className="flex items-center justify-between w-full">
										<span>All Statuses</span>
										<span className="text-xs text-muted-foreground">
											{data.length}
										</span>
									</div>
								</ComboboxItem>
								{statusOptions.map((option) => (
									<ComboboxItem
										key={option.value}
										value={option.label}
									>
										<div className="flex items-center justify-between w-full">
											<span>{option.label}</span>
											<span className="text-xs text-muted-foreground">
												{option.count}
											</span>
										</div>
									</ComboboxItem>
								))}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>

					<Combobox
						value={filterArea}
						onValueChange={(value) =>
							setFilterArea(value || ALL_AREAS_FILTER_VALUE)
						}
					>
						<ComboboxInput
							placeholder="All Areas"
							aria-label="Filter by area"
							className={
								isAreaFilterActive
									? "border-blue-500 ring-1 ring-blue-500/20"
									: ""
							}
						/>
						<ComboboxContent>
							<ComboboxList>
								<ComboboxItem value={ALL_AREAS_FILTER_VALUE}>
									<div className="flex items-center justify-between w-full">
										<span>All Areas</span>
										<span className="text-xs text-muted-foreground">
											{data.length}
										</span>
									</div>
								</ComboboxItem>
								{areaOptions.map((option) => (
									<ComboboxItem
										key={option.value}
										value={option.label}
									>
										<div className="flex items-center justify-between w-full">
											<span>{option.label}</span>
											<span className="text-xs text-muted-foreground">
												{option.count}
											</span>
										</div>
									</ComboboxItem>
								))}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</div>

				<div className="flex justify-between items-center">
					<p className="text-sm text-gray-500">
						Showing {visibleProfiles.length} of {data.length}{" "}
						profiles
					</p>
					<div className="flex items-center gap-2">
						{hasActiveFilters && (
							<Button
								variant="outline"
								size="sm"
								onClick={resetFilters}
								className="cursor-pointer border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
							>
								Reset Filters
							</Button>
						)}
						<Combobox
							value={sortBy}
							onValueChange={(value) =>
								setSortBy(value || "name-asc")
							}
						>
							<ComboboxInput
								placeholder="Sort profiles"
								aria-label="Sort profiles"
							/>
							<ComboboxContent>
								<ComboboxList>
									<ComboboxItem value="updated-desc">
										Sort: Recently updated
									</ComboboxItem>
									<ComboboxItem value="updated-asc">
										Sort: Oldest updated
									</ComboboxItem>
									<ComboboxItem value="name-asc">
										Sort: Name A-Z
									</ComboboxItem>
									<ComboboxItem value="name-desc">
										Sort: Name Z-A
									</ComboboxItem>
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</div>
				</div>
			</div>

			<DataTable columns={columns} data={visibleProfiles} />
		</div>
	);
}
