import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	getAllCases,
	type CaseWithDetails,
	getCaseAreas,
	getCaseRelationships,
	deleteCase,
	getCaseProfiles,
} from "@/lib/cases";
import { getCaseDrugs } from "@/lib/drugs";
import { getProfile, type ProfileWithId } from "@/lib/profiles";
import {
	FolderPlus,
	Pill,
	MapPin,
	Network,
	AlertCircle,
	FileText,
	MessageSquare,
	CalendarIcon,
	X,
} from "lucide-react";
import { toast } from "sonner";

interface CaseWithMetadata extends CaseWithDetails {
	hasDrugs: boolean;
	hasAreas: boolean;
	hasNetwork: boolean;
	profileCount: number;
	drugs?: { drug_name: string; quantity: string; quantified_by: string }[];
	areas?: string[];
	profiles?: [number, string][]; // [profile_id, profile_name]
	relationships?: {
		source_profile_id: number;
		target_profile_id: number;
		relationship_type: string | null;
	}[];
}

export default function CasesPage() {
	const navigate = useNavigate();
	const [cases, setCases] = useState<CaseWithMetadata[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [caseToDelete, setCaseToDelete] = useState<CaseWithMetadata | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const [profileDialogOpen, setProfileDialogOpen] = useState(false);
	const [selectedProfile, setSelectedProfile] =
		useState<ProfileWithId | null>(null);
	const [loadingProfile, setLoadingProfile] = useState(false);
	const [searchText, setSearchText] = useState("");
	const [filterType, setFilterType] = useState("all");
	const [filterSeverity, setFilterSeverity] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [dateRange, setDateRange] = useState<DateRange | undefined>();
	const [sortBy, setSortBy] = useState("updated-desc");
	const [currentPage, setCurrentPage] = useState(1);
	const dividerClass = "text-muted-foreground";
	const dividerText = "\u00A0\u00A0|\u00A0\u00A0";
	const ITEMS_PER_PAGE = 10;

	// Replace one or more consecutive newlines with a single backslash
	const formatTextWithNewlineIndicator = (text: string) => {
		return text.replace(/[\r\n]+/g, " \\ ");
	};

	// Truncate text to maximum 20 characters with ellipsis
	const truncateName = (name: string, maxLength: number = 20) => {
		return name.length > maxLength
			? `${name.substring(0, maxLength)}...`
			: name;
	};

	useEffect(() => {
		fetchCases();
	}, []);

	const fetchCases = async () => {
		try {
			setLoading(true);
			const allCases = await getAllCases();

			// Enrich each case with metadata
			const enrichedCases = await Promise.all(
				allCases.map(async (caseItem) => {
					try {
						const [drugs, areas, relationships, profiles] =
							await Promise.all([
								getCaseDrugs(caseItem.id),
								getCaseAreas(caseItem.id),
								getCaseRelationships(caseItem.id),
								getCaseProfiles(caseItem.id),
							]);

						return {
							...caseItem,
							hasDrugs: drugs.length > 0,
							hasAreas: areas.length > 0,
							hasNetwork: relationships.length > 0,
							profileCount: profiles.length,
							drugs: drugs,
							areas: areas,
							profiles: profiles,
							relationships: relationships,
						};
					} catch (error) {
						console.error(
							`Failed to fetch metadata for case ${caseItem.id}:`,
							error,
						);
						return {
							...caseItem,
							hasDrugs: false,
							hasAreas: false,
							hasNetwork: false,
							profileCount: 0,
							drugs: [],
							areas: [],
							profiles: [],
							relationships: [],
						};
					}
				}),
			);

			setCases(enrichedCases);
		} catch (error) {
			console.error("Failed to fetch cases:", error);
			toast.error("Failed to load cases", { position: "top-center" });
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string | null) => {
		if (!status) return "bg-gray-100 text-gray-800";
		switch (status.toLowerCase()) {
			case "open":
				return "bg-blue-100 text-blue-800";
			case "closed":
				return "bg-green-100 text-green-800";
			case "under review":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getSeverityColor = (severity: string | null) => {
		if (!severity) return "bg-gray-100 text-gray-800";
		switch (severity.toLowerCase()) {
			case "low":
				return "bg-green-100 text-green-800";
			case "medium":
				return "bg-yellow-100 text-yellow-800";
			case "high":
				return "bg-orange-100 text-orange-800";
			case "critical":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const resetFilters = () => {
		setSearchText("");
		setFilterType("all");
		setFilterSeverity("all");
		setFilterStatus("all");
		setDateRange(undefined);
	};

	const hasActiveFilters =
		searchText !== "" ||
		filterType !== "all" ||
		filterSeverity !== "all" ||
		filterStatus !== "all" ||
		dateRange !== undefined;

	const handleProfileClick = async (profileId: number) => {
		try {
			setLoadingProfile(true);
			const profile = await getProfile(profileId);
			if (profile) {
				setSelectedProfile(profile);
				setProfileDialogOpen(true);
			}
		} catch (error) {
			console.error("Failed to fetch profile:", error);
			toast.error("Failed to load profile details", {
				position: "top-center",
			});
		} finally {
			setLoadingProfile(false);
		}
	};

	const handleDeleteCase = async () => {
		if (!caseToDelete) return;

		try {
			setIsDeleting(true);
			await deleteCase(caseToDelete.id);
			toast.success("Case deleted successfully", {
				position: "top-center",
			});
			setCases(cases.filter((c) => c.id !== caseToDelete.id));
			setDeleteDialogOpen(false);
			setCaseToDelete(null);
		} catch (error) {
			console.error("Failed to delete case:", error);
			toast.error("Failed to delete case", { position: "top-center" });
		} finally {
			setIsDeleting(false);
		}
	};

	const caseTypeOptions = useMemo(() => {
		return Array.from(
			new Set(
				cases
					.map((c) => c.case_type?.trim())
					.filter((value): value is string => Boolean(value)),
			),
		).sort((a, b) => a.localeCompare(b));
	}, [cases]);

	const severityOptions = useMemo(() => {
		return Array.from(
			new Set(
				cases
					.map((c) => c.severity_level?.trim())
					.filter((value): value is string => Boolean(value)),
			),
		).sort((a, b) => a.localeCompare(b));
	}, [cases]);

	const statusOptions = useMemo(() => {
		return Array.from(
			new Set(
				cases
					.map((c) => c.status?.trim())
					.filter((value): value is string => Boolean(value)),
			),
		).sort((a, b) => a.localeCompare(b));
	}, [cases]);

	const visibleCases = useMemo(() => {
		const query = searchText.trim().toLowerCase();

		const filtered = cases.filter((caseItem) => {
			if (
				filterType !== "all" &&
				(caseItem.case_type || "").toLowerCase() !==
					filterType.toLowerCase()
			) {
				return false;
			}
			if (
				filterSeverity !== "all" &&
				(caseItem.severity_level || "").toLowerCase() !==
					filterSeverity.toLowerCase()
			) {
				return false;
			}
			if (
				filterStatus !== "all" &&
				(caseItem.status || "").toLowerCase() !==
					filterStatus.toLowerCase()
			) {
				return false;
			}
			// Date range filter
			if (dateRange?.from || dateRange?.to) {
				if (!caseItem.case_date) return false;
				const caseDate = new Date(caseItem.case_date);
				if (dateRange.from) {
					const from = new Date(dateRange.from);
					from.setHours(0, 0, 0, 0);
					if (caseDate < from) return false;
				}
				if (dateRange.to) {
					const to = new Date(dateRange.to);
					to.setHours(23, 59, 59, 999);
					if (caseDate > to) return false;
				}
			}

			if (!query) return true;

			const searchableText = [
				caseItem.case_id,
				caseItem.case_name,
				caseItem.case_type,
				caseItem.severity_level,
				caseItem.status,
				caseItem.description,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			return searchableText.includes(query);
		});

		const sorted = [...filtered].sort((a, b) => {
			switch (sortBy) {
				case "title-asc":
					return (a.case_name || "").localeCompare(b.case_name || "");
				case "title-desc":
					return (b.case_name || "").localeCompare(a.case_name || "");
				case "created-asc":
					return (a.created_at || "").localeCompare(
						b.created_at || "",
					);
				case "created-desc":
					return (b.created_at || "").localeCompare(
						a.created_at || "",
					);
				case "updated-asc":
					return (a.updated_at || "").localeCompare(
						b.updated_at || "",
					);
				case "updated-desc":
				default:
					return (b.updated_at || "").localeCompare(
						a.updated_at || "",
					);
			}
		});

		return sorted;
	}, [
		cases,
		searchText,
		filterType,
		filterSeverity,
		filterStatus,
		dateRange,
		sortBy,
	]);

	const totalPages = Math.max(
		1,
		Math.ceil(visibleCases.length / ITEMS_PER_PAGE),
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [
		searchText,
		filterType,
		filterSeverity,
		filterStatus,
		dateRange,
		sortBy,
	]);

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages);
		}
	}, [currentPage, totalPages]);

	const paginatedCases = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return visibleCases.slice(start, start + ITEMS_PER_PAGE);
	}, [visibleCases, currentPage]);

	const pageWindow = useMemo(() => {
		const pages: number[] = [];
		const start = Math.max(1, currentPage - 2);
		const end = Math.min(totalPages, currentPage + 2);
		for (let page = start; page <= end; page++) {
			pages.push(page);
		}
		return pages;
	}, [currentPage, totalPages]);

	if (loading) {
		return (
			<div className="container mx-auto flex items-center justify-center py-12">
				<p className="text-gray-500">Loading cases...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto space-y-6 pb-6">
			{/* Header with stats */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold">Cases</h1>
					<p className="text-sm text-gray-500 mt-1">
						{cases.length} case{cases.length !== 1 ? "s" : ""} in
						system
					</p>
				</div>
				<Button
					className="cursor-pointer"
					onClick={() => navigate("/new-case")}
				>
					<FolderPlus className="h-4 w-4 mr-2" />
					File New Case
				</Button>
			</div>

			{/* Filters & Sort */}
			<div className="flex flex-col gap-3">
				<div className="flex gap-3">
					<Input
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						placeholder="Search by ID, title, type, status..."
						className="flex-1"
					/>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={`justify-start text-left font-normal ${!dateRange ? "text-muted-foreground" : ""}`}
								onClick={(e) => {
									if (dateRange) e.stopPropagation();
								}}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{dateRange?.from ? (
									dateRange.to ? (
										<>
											{format(
												dateRange.from,
												"MMM dd, yyyy",
											)}{" "}
											-{" "}
											{format(
												dateRange.to,
												"MMM dd, yyyy",
											)}
										</>
									) : (
										format(dateRange.from, "MMM dd, yyyy")
									)
								) : (
									<span>Filter by date</span>
								)}
								{dateRange && (
									<div
										className="ml-auto cursor-pointer"
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											setDateRange(undefined);
										}}
									>
										<X className="h-4 w-4 hover:text-destructive" />
									</div>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="range"
								defaultMonth={dateRange?.from}
								selected={dateRange}
								onSelect={setDateRange}
								numberOfMonths={1}
								captionLayout="dropdown"
							/>
						</PopoverContent>
					</Popover>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<select
						aria-label="Filter by case type"
						value={filterType}
						onChange={(e) => setFilterType(e.target.value)}
						className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
					>
						<option value="all">All Types</option>
						{caseTypeOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<select
						aria-label="Filter by severity level"
						value={filterSeverity}
						onChange={(e) => setFilterSeverity(e.target.value)}
						className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
					>
						<option value="all">All Severities</option>
						{severityOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<select
						aria-label="Filter by case status"
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
						className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
					>
						<option value="all">All Statuses</option>
						{statusOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="flex justify-between items-center">
				<p className="text-sm text-gray-500">
					Showing {visibleCases.length} of {cases.length} cases
				</p>
				<div className="flex items-center gap-2">
					{hasActiveFilters && (
						<Button
							variant="outline"
							size="sm"
							onClick={resetFilters}
							className="cursor-pointer"
						>
							Reset Filters
						</Button>
					)}
					<select
						aria-label="Sort cases"
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
					>
						<option value="updated-desc">
							Sort: Recently updated
						</option>
						<option value="updated-asc">
							Sort: Oldest updated
						</option>
						<option value="created-desc">
							Sort: Recent created
						</option>
						<option value="created-asc">
							Sort: Oldest created
						</option>
						<option value="title-asc">Sort: Title A-Z</option>
						<option value="title-desc">Sort: Title Z-A</option>
					</select>
				</div>
			</div>

			{/* Cases grid */}
			<div className="space-y-4">
				{cases.length === 0 ? (
					<Card>
						<CardContent className="pt-12 pb-12 text-center">
							<AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
							<p className="text-gray-500">No cases yet</p>
							<Button
								variant="outline"
								className="mt-4 cursor-pointer"
								onClick={() => navigate("/new-case")}
							>
								Create the first case
							</Button>
						</CardContent>
					</Card>
				) : visibleCases.length === 0 ? (
					<Card>
						<CardContent className="pt-12 pb-12 text-center">
							<p className="text-gray-500">
								No cases match current filters
							</p>
							<Button
								variant="outline"
								className="mt-4 cursor-pointer"
								onClick={resetFilters}
							>
								Reset filters
							</Button>
						</CardContent>
					</Card>
				) : (
					paginatedCases.map((caseItem) => (
						<Card
							key={caseItem.id}
							className="cursor-pointer gap-2 hover:bg-blue-50/50 transition-colors"
							onClick={() => navigate(`/case/${caseItem.id}`)}
						>
							{/* Always visible section - Details with badges */}
							<CardContent className="pt-2 space-y-2 pb-2">
								{/* Details Badge - Case ID, Title, Date, Time, Severity, Status, Description */}
								<div className="flex items-start gap-2">
									<Badge
										variant="outline"
										className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
									>
										<FileText className="h-3 w-3" />
										Info
									</Badge>
									<div className="flex-1 space-y-1">
										{/* Line 1: Case ID | Case Title + Type/Severity/Status badges */}
										<div className="flex items-start justify-between gap-3 text-sm text-gray-700">
											<div className="min-w-0 flex items-center gap-2 flex-wrap">
												{caseItem.case_id && (
													<span>
														{caseItem.case_id}
													</span>
												)}
												{caseItem.case_id &&
													caseItem.case_name && (
														<span
															className={
																dividerClass
															}
														>
															{dividerText}
														</span>
													)}
												{caseItem.case_name && (
													<span>
														{truncateName(
															caseItem.case_name,
														)}
													</span>
												)}
											</div>
											<div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">
												{caseItem.case_type && (
													<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{caseItem.case_type
															.charAt(0)
															.toUpperCase() +
															caseItem.case_type.slice(
																1,
															)}
													</span>
												)}
												{caseItem.severity_level && (
													<span
														className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(caseItem.severity_level)}`}
													>
														{caseItem.severity_level
															.charAt(0)
															.toUpperCase() +
															caseItem.severity_level.slice(
																1,
															)}
													</span>
												)}
												{caseItem.status && (
													<span
														className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}
													>
														{caseItem.status}
													</span>
												)}
											</div>
										</div>

										{/* Line 2: Date, Time, Description */}
										{(caseItem.case_date ||
											caseItem.case_time ||
											caseItem.description) && (
											<div className="flex items-center gap-2 flex-wrap text-sm text-gray-700">
												{(caseItem.case_date ||
													caseItem.case_time) && (
													<>
														{caseItem.case_date && (
															<span>
																{new Date(
																	caseItem.case_date,
																).toLocaleDateString()}
															</span>
														)}
														{caseItem.case_date &&
															caseItem.case_time && (
																<span
																	className={
																		dividerClass
																	}
																>
																	{
																		dividerText
																	}
																</span>
															)}
														{caseItem.case_time && (
															<span>
																{
																	caseItem.case_time
																}
															</span>
														)}
														{caseItem.description && (
															<span
																className={
																	dividerClass
																}
															>
																{dividerText}
															</span>
														)}
													</>
												)}
												{caseItem.description && (
													<span>
														{(() => {
															const formatted =
																formatTextWithNewlineIndicator(
																	caseItem.description,
																);
															return formatted.length >
																100
																? `${formatted.substring(0, 100)}...`
																: formatted;
														})()}
													</span>
												)}
											</div>
										)}
									</div>
								</div>

								{/* Network Badge + Details */}
								{caseItem.profiles &&
									caseItem.profiles.length > 0 && (
										<div className="flex items-start gap-2">
											<Badge
												variant="outline"
												className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
											>
												<Network className="h-3 w-3" />
												Network
											</Badge>
											<div className="text-sm text-gray-700 truncate">
												{caseItem.profiles.map((p) => (
													<span
														key={p[0]}
														onClick={(e) => {
															e.stopPropagation();
															handleProfileClick(
																p[0],
															);
														}}
														className="cursor-pointer hover:underline text-blue-600 hover:text-blue-800"
													>
														{truncateName(p[1])}
														{caseItem.profiles!.indexOf(
															p,
														) !==
															caseItem.profiles!
																.length -
																1 && (
															<span
																className={
																	dividerClass
																}
															>
																{dividerText}
															</span>
														)}
													</span>
												))}
											</div>
										</div>
									)}

								{/* Drugs Badge + Details */}
								{caseItem.drugs &&
									caseItem.drugs.length > 0 && (
										<div className="flex items-start gap-2">
											<Badge
												variant="outline"
												className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
											>
												<Pill className="h-3 w-3" />
												Drugs
											</Badge>
											<p className="text-sm text-gray-700">
												{caseItem.drugs.map(
													(d, index) => (
														<span
															key={`${d.drug_name}-${index}`}
														>
															{`${truncateName(d.drug_name)}(${d.quantified_by}): ${d.quantity}`}
															{index !==
																caseItem.drugs!
																	.length -
																	1 && (
																<span
																	className={
																		dividerClass
																	}
																>
																	{
																		dividerText
																	}
																</span>
															)}
														</span>
													),
												)}
											</p>
										</div>
									)}

								{/* Areas Badge + Details */}
								{caseItem.areas &&
									caseItem.areas.length > 0 && (
										<div className="flex items-start gap-2">
											<Badge
												variant="outline"
												className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
											>
												<MapPin className="h-3 w-3" />
												Areas
											</Badge>
											<p className="text-sm text-gray-700">
												{caseItem.areas.map(
													(area, index) => (
														<span
															key={`${area}-${index}`}
														>
															{area}
															{index !==
																caseItem.areas!
																	.length -
																	1 && (
																<span
																	className={
																		dividerClass
																	}
																>
																	{
																		dividerText
																	}
																</span>
															)}
														</span>
													),
												)}
											</p>
										</div>
									)}

								{/* Notes Badge + Details */}
								{caseItem.notes && (
									<div className="flex items-start gap-2">
										<Badge
											variant="outline"
											className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
										>
											<MessageSquare className="h-3 w-3" />
											Notes
										</Badge>
										<p className="text-sm text-gray-700 truncate">
											{formatTextWithNewlineIndicator(
												caseItem.notes,
											)}
										</p>
									</div>
								)}

								{caseItem.created_at && (
									<p className="text-xs text-gray-500 mt-3">
										Created At:{" "}
										{new Date(
											caseItem.created_at,
										).toLocaleDateString()}
										<span className={dividerClass}>
											{dividerText}
										</span>
										Updated At:{" "}
										{new Date(
											caseItem.created_at,
										).toLocaleDateString()}
									</p>
								)}
							</CardContent>
						</Card>
					))
				)}
			</div>

			{visibleCases.length > 0 && totalPages > 1 && (
				<div className="space-y-2">
					<p className="text-sm text-gray-500 text-center">
						Page {currentPage} of {totalPages} • Showing{" "}
						{(currentPage - 1) * ITEMS_PER_PAGE + 1}-
						{Math.min(
							currentPage * ITEMS_PER_PAGE,
							visibleCases.length,
						)}
					</p>
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (currentPage > 1) {
											setCurrentPage((prev) =>
												Math.max(1, prev - 1),
											);
										}
									}}
									aria-disabled={currentPage === 1}
									className={
										currentPage === 1
											? "pointer-events-none opacity-50"
											: undefined
									}
								/>
							</PaginationItem>

							{pageWindow[0] > 1 && (
								<>
									<PaginationItem>
										<PaginationLink
											href="#"
											onClick={(e) => {
												e.preventDefault();
												setCurrentPage(1);
											}}
											isActive={currentPage === 1}
										>
											1
										</PaginationLink>
									</PaginationItem>
									{pageWindow[0] > 2 && (
										<PaginationItem>
											<PaginationEllipsis />
										</PaginationItem>
									)}
								</>
							)}

							{pageWindow.map((page) => (
								<PaginationItem key={page}>
									<PaginationLink
										href="#"
										onClick={(e) => {
											e.preventDefault();
											setCurrentPage(page);
										}}
										isActive={currentPage === page}
									>
										{page}
									</PaginationLink>
								</PaginationItem>
							))}

							{pageWindow[pageWindow.length - 1] < totalPages && (
								<>
									{pageWindow[pageWindow.length - 1] <
										totalPages - 1 && (
										<PaginationItem>
											<PaginationEllipsis />
										</PaginationItem>
									)}
									<PaginationItem>
										<PaginationLink
											href="#"
											onClick={(e) => {
												e.preventDefault();
												setCurrentPage(totalPages);
											}}
											isActive={
												currentPage === totalPages
											}
										>
											{totalPages}
										</PaginationLink>
									</PaginationItem>
								</>
							)}

							<PaginationItem>
								<PaginationNext
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (currentPage < totalPages) {
											setCurrentPage((prev) =>
												Math.min(totalPages, prev + 1),
											);
										}
									}}
									aria-disabled={currentPage === totalPages}
									className={
										currentPage === totalPages
											? "pointer-events-none opacity-50"
											: undefined
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Case</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete case{" "}
							<strong>{caseToDelete?.cno}</strong> (
							{caseToDelete?.case_name
								? truncateName(caseToDelete.case_name)
								: ""}
							)? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteCase}
							disabled={isDeleting}
							className="cursor-pointer"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Profile Details Dialog */}
			<AlertDialog
				open={profileDialogOpen}
				onOpenChange={setProfileDialogOpen}
			>
				<AlertDialogContent className="max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{selectedProfile?.full_name
								? truncateName(selectedProfile.full_name)
								: "Profile Details"}
						</AlertDialogTitle>
					</AlertDialogHeader>
					{loadingProfile ? (
						<p className="text-center text-gray-500 py-4">
							Loading profile details...
						</p>
					) : selectedProfile ? (
						<div className="space-y-2 text-sm">
							{selectedProfile.alias && (
								<div>
									<span className="font-semibold text-gray-600">
										Alias:
									</span>
									<span className="ml-2">
										{truncateName(selectedProfile.alias)}
									</span>
								</div>
							)}
							{selectedProfile.nic && (
								<div>
									<span className="font-semibold text-gray-600">
										NIC:
									</span>
									<span className="ml-2">
										{selectedProfile.nic}
									</span>
								</div>
							)}
							{selectedProfile.city && (
								<div>
									<span className="font-semibold text-gray-600">
										City:
									</span>
									<span className="ml-2">
										{selectedProfile.city}
									</span>
								</div>
							)}
							{selectedProfile.address_line1 && (
								<div>
									<span className="font-semibold text-gray-600">
										Address:
									</span>
									<span className="ml-2">
										{selectedProfile.address_line1}
										{selectedProfile.address_line2
											? `, ${selectedProfile.address_line2}`
											: ""}
									</span>
								</div>
							)}
							{selectedProfile.risk_level && (
								<div>
									<span className="font-semibold text-gray-600">
										Risk Level:
									</span>
									<span className="ml-2">
										{selectedProfile.risk_level}
									</span>
								</div>
							)}
							{selectedProfile.status && (
								<div>
									<span className="font-semibold text-gray-600">
										Status:
									</span>
									<span className="ml-2">
										{selectedProfile.status}
									</span>
								</div>
							)}
							{selectedProfile.notes && (
								<div>
									<span className="font-semibold text-gray-600">
										Notes:
									</span>
									<p className="ml-2 text-gray-700 whitespace-pre-wrap">
										{selectedProfile.notes}
									</p>
								</div>
							)}
						</div>
					) : null}
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => setProfileDialogOpen(false)}
						>
							Close
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (selectedProfile) {
									navigate(`/profile/${selectedProfile.id}`);
									setProfileDialogOpen(false);
								}
							}}
							className="cursor-pointer"
						>
							View Profile
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
