import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	getCase,
	getCaseAreas,
	getCaseRelationships,
	getCaseProfiles,
	deleteCase,
	type CaseWithDetails,
} from "@/lib/cases";
import { getCaseDrugs } from "@/lib/drugs";
import {
	ChevronLeft,
	Pill,
	MapPin,
	Network,
	Calendar,
	Clock,
	MoreVertical,
	Trash2,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface CaseDetails extends CaseWithDetails {
	drugs?: { drug_name: string; quantity: string; quantified_by: string }[];
	areas?: string[];
	profiles?: [number, string][];
	relationships?: {
		source_profile_id: number;
		target_profile_id: number;
		relationship_type: string | null;
	}[];
}

export default function CaseViewPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [caseData, setCaseData] = useState<CaseDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		fetchCaseDetails();
	}, [id]);

	const fetchCaseDetails = async () => {
		if (!id) return;

		try {
			setLoading(true);
			const caseId = parseInt(id, 10);
			const [caseDetails, drugs, areas, relationships, profiles] =
				await Promise.all([
					getCase(caseId),
					getCaseDrugs(caseId),
					getCaseAreas(caseId),
					getCaseRelationships(caseId),
					getCaseProfiles(caseId),
				]);

			if (caseDetails) {
				setCaseData({
					...caseDetails,
					drugs,
					areas,
					profiles,
					relationships,
				});
			}
		} catch (error) {
			console.error("Failed to fetch case details:", error);
			toast.error("Failed to load case details", {
				position: "top-center",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteCase = async () => {
		if (!caseData) return;

		try {
			setIsDeleting(true);
			await deleteCase(caseData.id);
			toast.success("Case deleted successfully", {
				position: "top-center",
			});
			navigate("/cases");
		} catch (error) {
			console.error("Failed to delete case:", error);
			toast.error("Failed to delete case", { position: "top-center" });
		} finally {
			setIsDeleting(false);
			setDeleteDialogOpen(false);
		}
	};

	const getCaseTypeBadges = () => {
		if (!caseData) return [];
		const badges = [];

		if (caseData.relationships && caseData.relationships.length > 0) {
			badges.push(
				<Badge
					key="network"
					variant="outline"
					className="flex items-center gap-1"
				>
					<Network className="h-3 w-3" />
					Network
				</Badge>,
			);
		}

		if (caseData.drugs && caseData.drugs.length > 0) {
			badges.push(
				<Badge
					key="drugs"
					variant="outline"
					className="flex items-center gap-1"
				>
					<Pill className="h-3 w-3" />
					Drug
				</Badge>,
			);
		}

		if (caseData.areas && caseData.areas.length > 0) {
			badges.push(
				<Badge
					key="areas"
					variant="outline"
					className="flex items-center gap-1"
				>
					<MapPin className="h-3 w-3" />
					Area
				</Badge>,
			);
		}

		return badges;
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
		if (!severity) return "text-gray-500";
		switch (severity.toLowerCase()) {
			case "low":
				return "text-green-600";
			case "medium":
				return "text-yellow-600";
			case "high":
				return "text-orange-600";
			case "critical":
				return "text-red-600";
			default:
				return "text-gray-500";
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto flex items-center justify-center py-12">
				<p className="text-gray-500">Loading case details...</p>
			</div>
		);
	}

	if (!caseData) {
		return (
			<div className="container mx-auto py-6">
				<Button
					variant="outline"
					size="sm"
					className="mb-6"
					onClick={() => navigate("/cases")}
				>
					<ChevronLeft className="h-4 w-4 mr-2" />
					Back to Cases
				</Button>
				<Card>
					<CardContent className="pt-12 pb-12 text-center">
						<AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
						<p className="text-gray-500">Case not found</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			{/* Back button */}
			<Button
				variant="outline"
				size="sm"
				className="cursor-pointer"
				onClick={() => navigate("/cases")}
			>
				<ChevronLeft className="h-4 w-4 mr-2" />
				Back to Cases
			</Button>

			{/* Main card */}
			<Card>
				<CardHeader className="pb-3 space-y-3">
					{/* Title row with status and menu */}
					<div className="flex justify-between items-start">
						<div className="flex-1">
							<div className="flex items-baseline gap-2 mb-2">
								<code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
									{caseData.cno}
								</code>
								<h1 className="text-2xl font-bold">
									{caseData.case_name}
								</h1>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span
								className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseData.status)}`}
							>
								{caseData.status || "Unknown"}
							</span>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="secondary"
										size="sm"
										className="cursor-pointer"
									>
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-44"
								>
									<DropdownMenuItem
										onSelect={() =>
											navigate(`/new-case/${caseData.id}`)
										}
										className="cursor-pointer"
									>
										Edit Case
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										variant="destructive"
										onSelect={() =>
											setDeleteDialogOpen(true)
										}
										disabled={isDeleting}
										className="cursor-pointer"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete Case
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					{/* Badges */}
					<div className="flex flex-wrap gap-2">
						{getCaseTypeBadges()}
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* Profiles Section */}
					{caseData.profiles && caseData.profiles.length > 0 && (
						<div className="flex items-start gap-2">
							<Badge
								variant="outline"
								className="flex items-center gap-1 flex-shrink-0 mt-0.5"
							>
								<Network className="h-3 w-3" />
								Profiles
							</Badge>
							<p className="text-sm text-gray-700">
								{caseData.profiles.map((p) => p[1]).join(", ")}
							</p>
						</div>
					)}

					{/* Drugs Section */}
					{caseData.drugs && caseData.drugs.length > 0 && (
						<div className="flex items-start gap-2">
							<Badge
								variant="outline"
								className="flex items-center gap-1 flex-shrink-0 mt-0.5"
							>
								<Pill className="h-3 w-3" />
								Drugs
							</Badge>
							<p className="text-sm text-gray-700">
								{caseData.drugs
									.map(
										(d) =>
											`${d.drug_name} (${d.quantity} ${d.quantified_by})`,
									)
									.join(", ")}
							</p>
						</div>
					)}

					{/* Areas Section */}
					{caseData.areas && caseData.areas.length > 0 && (
						<div className="flex items-start gap-2">
							<Badge
								variant="outline"
								className="flex items-center gap-1 flex-shrink-0 mt-0.5"
							>
								<MapPin className="h-3 w-3" />
								Areas
							</Badge>
							<p className="text-sm text-gray-700">
								{caseData.areas.join(", ")}
							</p>
						</div>
					)}

					{/* Case Type */}
					{caseData.case_type && (
						<div className="flex items-start gap-2">
							<Badge
								variant="secondary"
								className="flex-shrink-0 mt-0.5"
							>
								Type
							</Badge>
							<p className="text-sm text-gray-700">
								{caseData.case_type}
							</p>
						</div>
					)}

					{/* Severity Level */}
					{caseData.severity_level && (
						<div className="flex items-start gap-2">
							<Badge
								variant="secondary"
								className="flex-shrink-0 mt-0.5"
							>
								Severity
							</Badge>
							<p
								className={`text-sm font-medium ${getSeverityColor(caseData.severity_level)}`}
							>
								{caseData.severity_level
									.charAt(0)
									.toUpperCase() +
									caseData.severity_level.slice(1)}
							</p>
						</div>
					)}

					{/* Date and Time */}
					{(caseData.case_date || caseData.case_time) && (
						<div className="flex items-start gap-2">
							{caseData.case_date && (
								<>
									<Badge
										variant="secondary"
										className="flex items-center gap-1 flex-shrink-0 mt-0.5"
									>
										<Calendar className="h-3 w-3" />
										Date
									</Badge>
									<p className="text-sm text-gray-700">
										{new Date(
											caseData.case_date,
										).toLocaleDateString()}
									</p>
								</>
							)}
							{caseData.case_time && (
								<>
									<Badge
										variant="secondary"
										className="flex items-center gap-1 flex-shrink-0 ml-2 mt-0.5"
									>
										<Clock className="h-3 w-3" />
										Time
									</Badge>
									<p className="text-sm text-gray-700">
										{caseData.case_time}
									</p>
								</>
							)}
						</div>
					)}

					{/* Description */}
					{caseData.description && (
						<>
							<div className="border-t" />
							<div>
								<label className="text-sm font-semibold text-gray-600 uppercase">
									Description
								</label>
								<p className="text-sm text-gray-700 mt-2">
									{caseData.description}
								</p>
							</div>
						</>
					)}

					{/* Notes Section */}
					{caseData.notes && (
						<>
							<div className="border-t" />
							<div>
								<label className="text-sm font-semibold text-gray-600 uppercase">
									Notes
								</label>
								<p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
									{caseData.notes}
								</p>
							</div>
						</>
					)}

					{/* Timestamps */}
					{caseData.created_at && (
						<>
							<div className="border-t" />
							<div className="flex items-start gap-2">
								<Badge
									variant="secondary"
									className="flex-shrink-0 mt-0.5"
								>
									Created At
								</Badge>
								<p className="text-sm text-gray-700">
									{new Date(
										caseData.created_at,
									).toLocaleDateString()}
								</p>
							</div>
							<div className="flex items-start gap-2">
								<Badge
									variant="secondary"
									className="flex-shrink-0 mt-0.5"
								>
									Updated At
								</Badge>
								<p className="text-sm text-gray-700">
									{new Date(
										caseData.created_at,
									).toLocaleDateString()}
								</p>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Case</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this case? This
							action cannot be undone.
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
		</div>
	);
}
