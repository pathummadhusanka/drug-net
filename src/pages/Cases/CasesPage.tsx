import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
	const dividerClass = "text-muted-foreground";
	const dividerText = "\u00A0\u00A0|\u00A0\u00A0";

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

			{/* Summary stats */}
			<div className="grid gap-4 grid-cols-1 md:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-bold">{cases.length}</p>
						<p className="text-sm text-gray-500">Total Cases</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-bold">
							{
								cases.filter(
									(c) =>
										c.status &&
										c.status.toLowerCase() === "open",
								).length
							}
						</p>
						<p className="text-sm text-gray-500">Open</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-bold">
							{cases.filter((c) => c.hasDrugs).length}
						</p>
						<p className="text-sm text-gray-500">Drug Cases</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-bold">
							{cases.filter((c) => c.hasNetwork).length}
						</p>
						<p className="text-sm text-gray-500">Network Cases</p>
					</CardContent>
				</Card>
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
				) : (
					cases.map((caseItem) => (
						<Card
							key={caseItem.id}
							className="cursor-pointer hover:shadow-md transition-shadow gap-2"
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
										{/* Line 1: Case ID | Case Title */}
										<p className="text-sm text-gray-700">
											{caseItem.case_id && (
												<span>{caseItem.case_id}</span>
											)}
											{caseItem.case_id &&
												caseItem.case_name && (
													<span
														className={dividerClass}
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
										</p>

										{/* Line 2: Date, Time, Severity, Status, Description */}
										{(caseItem.case_date ||
											caseItem.case_time ||
											caseItem.severity_level ||
											caseItem.status ||
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
														{(caseItem.severity_level ||
															caseItem.status ||
															caseItem.description) && (
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
												{caseItem.severity_level && (
													<>
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
														{(caseItem.status ||
															caseItem.description) && (
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
												{caseItem.status && (
													<>
														<span
															className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}
														>
															{caseItem.status}
														</span>
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
															{`${truncateName(d.drug_name)} (${d.quantity} ${d.quantified_by})`}
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
