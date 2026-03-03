import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { ChevronLeft, MoreVertical, Trash2, AlertCircle } from "lucide-react";
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
				<div className="text-center py-12">
					<AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
					<p className="text-gray-500">Case not found</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="w-full mx-auto space-y-1">
				<div className="flex items-center justify-between">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="cursor-pointer"
						onClick={() => navigate("/cases")}
					>
						<ChevronLeft className="h-4 w-4 mr-2" />
						All Cases
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="cursor-pointer"
							>
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
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
								onSelect={() => setDeleteDialogOpen(true)}
								disabled={isDeleting}
								className="cursor-pointer"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Case
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="space-y-6 mt-6">
					{/* [1] Info Section - Two Column Layout */}
					<div className="space-y-6">
						<h3 className="text-sm font-semibold text-gray-700">
							Info
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Case ID */}
							<div className="space-y-1">
								<Label className="text-xs text-gray-500">
									Case ID
								</Label>
								<p className="text-base font-medium text-gray-900">
									{caseData.case_id || "_"}
								</p>
							</div>

							{/* Case Type */}
							<div className="space-y-1">
								<Label className="text-xs text-gray-500">
									Case Type
								</Label>
								<p className="text-base font-medium text-gray-900">
									{caseData.case_type || "_"}
								</p>
							</div>

							{/* Title - Full Width */}
							<div className="space-y-1 md:col-span-2">
								<Label className="text-xs text-gray-500">
									Title
								</Label>
								<p className="text-base font-medium text-gray-900">
									{caseData.case_name || "_"}
								</p>
							</div>

							{/* Description - Full Width */}
							<div className="space-y-1 md:col-span-2">
								<Label className="text-xs text-gray-500">
									Description
								</Label>
								<p className="text-base font-medium text-gray-900 whitespace-pre-wrap">
									{caseData.description || "_"}
								</p>
							</div>

							{/* Date */}
							<div className="space-y-1">
								<Label className="text-xs text-gray-500">
									Date
								</Label>
								<p className="text-base font-medium text-gray-900">
									{caseData.case_date
										? new Date(
												caseData.case_date,
											).toLocaleDateString()
										: "_"}
								</p>
							</div>

							{/* Time */}
							<div className="space-y-1">
								<Label className="text-xs text-gray-500">
									Time
								</Label>
								<p className="text-base font-medium text-gray-900">
									{caseData.case_time || "_"}
								</p>
							</div>

							{/* Severity Level */}
							<div className="space-y-1">
								<Label className="text-xs text-gray-500">
									Severity Level
								</Label>
								<p
									className={`text-base font-medium ${getSeverityColor(caseData.severity_level)}`}
								>
									{caseData.severity_level
										? caseData.severity_level
												.charAt(0)
												.toUpperCase() +
											caseData.severity_level.slice(1)
										: "_"}
								</p>
							</div>

							{/* Case Status */}
							<div className="space-y-1">
								<Label className="text-xs text-gray-500">
									Case Status
								</Label>
								<p className="text-base font-medium text-gray-900">
									{caseData.status || "_"}
								</p>
							</div>
						</div>
					</div>

					<Separator />

					{/* [2] Network Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold text-gray-700">
							Network
						</h3>
						<div>
							<Label className="text-xs text-gray-500">
								Profiles
							</Label>
							<p className="text-sm text-gray-700">
								{caseData.profiles &&
								caseData.profiles.length > 0
									? caseData.profiles
											.map((p) => p[1])
											.join(", ")
									: "_"}
							</p>
						</div>

						{caseData.relationships &&
						caseData.relationships.length > 0 ? (
							<div>
								<Label className="text-xs text-gray-500">
									Connections
								</Label>
								<div className="space-y-2">
									{caseData.relationships.map((rel, idx) => (
										<div
											key={idx}
											className="text-sm text-gray-700 p-2 bg-gray-50 rounded"
										>
											Profile {rel.source_profile_id}{" "}
											{rel.relationship_type && (
												<span className="font-medium">
													{rel.relationship_type}
												</span>
											)}{" "}
											Profile {rel.target_profile_id}
										</div>
									))}
								</div>
							</div>
						) : (
							<div>
								<Label className="text-xs text-gray-500">
									Connections
								</Label>
								<p className="text-sm text-gray-700">_</p>
							</div>
						)}
					</div>

					<Separator />

					{/* [3] Drugs Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold text-gray-700">
							Drugs
						</h3>
						<div>
							<div className="space-y-2">
								{caseData.drugs && caseData.drugs.length > 0 ? (
									caseData.drugs.map((drug, idx) => (
										<div
											key={idx}
											className="text-base font-medium text-gray-900 p-2 bg-gray-50 rounded"
										>
											{drug.drug_name}(
											{drug.quantified_by}):{" "}
											{drug.quantity}
										</div>
									))
								) : (
									<p className="text-base font-medium text-gray-900">
										_
									</p>
								)}
							</div>
						</div>
					</div>

					<Separator />

					{/* [4] Areas Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold text-gray-700">
							Areas
						</h3>
						<div>
							{caseData.areas && caseData.areas.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{caseData.areas.map((area, idx) => (
										<div
											key={idx}
											className="text-base font-medium text-gray-900 p-2 bg-gray-50 rounded"
										>
											{area}
										</div>
									))}
								</div>
							) : (
								<p className="text-base font-medium text-gray-900">
									_
								</p>
							)}
						</div>
					</div>

					<Separator />

					{/* [5] Notes Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold text-gray-700">
							Notes
						</h3>
						<div>
							{caseData.notes ? (
								<p className="text-base font-medium text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">
									{caseData.notes}
								</p>
							) : (
								<p className="text-base font-medium text-gray-900">
									_
								</p>
							)}
						</div>
					</div>

					<Separator />

					{/* Metadata */}
					<div className="flex flex-col gap-2">
						{caseData.created_at && (
							<div className="flex flex-row items-center gap-3">
								<Label className="text-xs text-gray-500 w-20">
									Created At
								</Label>
								<p className="text-xs font-medium text-gray-600">
									{new Date(
										caseData.created_at,
									).toLocaleString("en-GB")}
								</p>
							</div>
						)}
						{caseData.updated_at && (
							<div className="flex flex-row items-center gap-3">
								<Label className="text-xs text-gray-500 w-20">
									Updated At
								</Label>
								<p className="text-xs font-medium text-gray-600">
									{new Date(
										caseData.updated_at,
									).toLocaleString("en-GB")}
								</p>
							</div>
						)}
					</div>
				</div>
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
		</>
	);
}
