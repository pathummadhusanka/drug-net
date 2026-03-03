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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	getCase,
	getCaseAreas,
	getCaseRelationships,
	getCaseProfiles,
	deleteCase,
	type CaseWithDetails,
} from "@/lib/cases";
import { getCaseDrugs } from "@/lib/drugs";
import { getProfile } from "@/lib/profiles";
import {
	Background,
	BackgroundVariant,
	Controls,
	Handle,
	MarkerType,
	MiniMap,
	Position,
	Edge,
	EdgeProps,
	BaseEdge,
	EdgeLabelRenderer,
	Node,
	useEdgesState,
	useNodesState,
} from "reactflow";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import {
	ChevronLeft,
	MoreVertical,
	Trash2,
	AlertCircle,
	Info,
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

// Read-only CustomNode component
const ReadOnlyCustomNode = ({
	data,
}: {
	data: {
		label: string;
		fullName?: string;
		nic?: string | null;
		alias?: string | null;
		city?: string | null;
	};
}) => {
	const [tooltipOpen, setTooltipOpen] = useState(false);

	// Truncate name to 20 characters max
	const displayName = data.fullName
		? data.fullName.length > 20
			? data.fullName.substring(0, 20) + "..."
			: data.fullName
		: data.label.length > 20
			? data.label.substring(0, 20) + "..."
			: data.label;

	const displayAlias = data.alias
		? data.alias.length > 20
			? data.alias.substring(0, 20) + "..."
			: data.alias
		: null;

	// Build tooltip with profile details
	const tooltipParts = [];
	if (data.fullName) tooltipParts.push(data.fullName);
	if (data.nic) tooltipParts.push(`NIC: ${data.nic}`);
	if (data.alias) tooltipParts.push(`Alias: ${data.alias}`);
	if (data.city) tooltipParts.push(`City: ${data.city}`);

	return (
		<div className="px-4 py-2 shadow-md rounded-md bg-white text-black border-2 border-gray-400 relative">
			<Handle type="target" position={Position.Top} id="top" />
			<Handle type="target" position={Position.Right} id="right" />
			<Handle type="target" position={Position.Bottom} id="bottom" />
			<Handle type="target" position={Position.Left} id="left" />
			<Handle type="source" position={Position.Top} id="top" />
			<Handle type="source" position={Position.Right} id="right" />
			<Handle type="source" position={Position.Bottom} id="bottom" />
			<Handle type="source" position={Position.Left} id="left" />
			<div className="flex flex-col gap-0.5">
				<div className="flex items-start justify-between gap-0.5">
					<div className="font-medium text-sm flex-1">
						{displayName}
					</div>
					<Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
						<TooltipTrigger asChild>
							<button
								onClick={(e) => {
									e.stopPropagation();
									setTooltipOpen(!tooltipOpen);
								}}
								className="hover:bg-blue-100 hover:bg-opacity-20 text-current hover:text-blue-600 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer p-0 shrink-0"
								title="Show profile info"
							>
								<Info className="w-3 h-3" />
							</button>
						</TooltipTrigger>
						<TooltipContent className="bg-slate-900 text-white p-3 rounded-md">
							<div className="text-sm space-y-1">
								{tooltipParts.map((part, idx) => (
									<div key={idx}>{part}</div>
								))}
							</div>
						</TooltipContent>
					</Tooltip>
				</div>
				{displayAlias && (
					<div className="text-xs opacity-80 italic">
						{displayAlias}
					</div>
				)}
			</div>
		</div>
	);
};

// Read-only CustomEdge component with gradient
const ReadOnlyCustomEdge = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	data,
	markerEnd,
}: EdgeProps) => {
	const gradientId = `edge-gradient-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
	const label = (data?.label as string) || "";
	const midX = (sourceX + targetX) / 2;
	const midY = (sourceY + targetY) / 2;
	const edgePath = `M ${sourceX},${sourceY} Q ${midX},${midY} ${targetX},${targetY}`;
	const labelX = 0.25 * sourceX + 0.5 * midX + 0.25 * targetX;
	const labelY = 0.25 * sourceY + 0.5 * midY + 0.25 * targetY;

	// Truncate label if longer than 15 characters
	const displayLabel =
		label.length > 15 ? label.substring(0, 15) + "..." : label;

	return (
		<>
			<defs>
				<linearGradient
					id={gradientId}
					x1={sourceX}
					y1={sourceY}
					x2={targetX}
					y2={targetY}
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0%" stopColor="#60a5fa" />
					<stop offset="100%" stopColor="#f87171" />
				</linearGradient>
			</defs>
			<BaseEdge
				id={id}
				path={edgePath}
				markerEnd={markerEnd}
				style={{
					stroke: `url(#${gradientId})`,
					strokeWidth: 2,
				}}
			/>
			{displayLabel && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
							pointerEvents: "none",
						}}
						className="nodrag nopan"
					>
						<div className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs select-none">
							{displayLabel}
						</div>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
};

export default function CaseViewPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [caseData, setCaseData] = useState<CaseDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [nodes, setNodes] = useNodesState([]);
	const [edges, setEdges] = useEdgesState([]);

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

	// Generate nodes and edges from profile and relationship data
	useEffect(() => {
		if (!caseData || !caseData.profiles || caseData.profiles.length === 0) {
			setNodes([]);
			setEdges([]);
			return;
		}

		// Fetch full profile details for all profiles
		const fetchProfileDetails = async () => {
			const profiles = caseData.profiles;
			if (!profiles || profiles.length === 0) return;

			const profileDetailsPromises = profiles.map((profile) =>
				getProfile(profile[0]),
			);
			const profileDetails = await Promise.all(profileDetailsPromises);

			// Create nodes from profiles with full details
			const newNodes: Node[] = profiles.map((profile, idx) => {
				const fullProfile = profileDetails[idx];
				return {
					id: profile[0].toString(),
					data: {
						label: profile[1],
						fullName: fullProfile?.full_name || profile[1],
						nic: fullProfile?.nic || null,
						alias: fullProfile?.alias || null,
						city: fullProfile?.city || null,
					},
					position: {
						x: (idx % 3) * 300 + 50,
						y: Math.floor(idx / 3) * 250 + 50,
					},
					type: "custom",
				};
			});

			// Create edges from relationships
			const newEdges: Edge[] = (caseData.relationships || []).map(
				(rel) => ({
					id: `edge-${rel.source_profile_id}-${rel.target_profile_id}`,
					source: rel.source_profile_id.toString(),
					target: rel.target_profile_id.toString(),
					type: "custom",
					data: { label: rel.relationship_type || "" },
					markerEnd: { type: MarkerType.ArrowClosed },
				}),
			);

			setNodes(newNodes);
			setEdges(newEdges);
		};

		fetchProfileDetails();
	}, [caseData, setNodes, setEdges]);

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
						{caseData.profiles && caseData.profiles.length > 0 ? (
							<div
								className="w-full bg-gray-50 rounded border border-gray-200"
								style={{ height: "500px" }}
							>
								<ReactFlow
									nodes={nodes}
									edges={edges}
									nodeTypes={{ custom: ReadOnlyCustomNode }}
									edgeTypes={{ custom: ReadOnlyCustomEdge }}
								>
									<Background
										color="#aaa"
										gap={16}
										variant={BackgroundVariant.Dots}
									/>
									<Controls />
									<MiniMap />
								</ReactFlow>
							</div>
						) : (
							<div className="bg-gray-50 p-4 rounded border border-gray-200">
								<p className="text-sm text-gray-600">
									No profiles associated with this case
								</p>
							</div>
						)}
					</div>

					<Separator />
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
