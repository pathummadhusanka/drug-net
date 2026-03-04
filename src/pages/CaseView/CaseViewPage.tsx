import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
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
	useReactFlow,
} from "reactflow";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import {
	ChevronLeft,
	MoreVertical,
	Pencil,
	Trash2,
	AlertCircle,
	Info,
	User,
	CircleHelp,
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

	// Truncate name to 20 characters max for compact display
	const displayName = data.fullName
		? data.fullName.length > 20
			? data.fullName.substring(0, 20) + "..."
			: data.fullName
		: data.label.length > 20
			? data.label.substring(0, 20) + "..."
			: data.label;

	const displaySubtitle = data.alias || data.city || null;
	const truncatedSubtitle = displaySubtitle
		? displaySubtitle.length > 20
			? displaySubtitle.substring(0, 20) + "..."
			: displaySubtitle
		: null;

	// Build tooltip with profile details
	const tooltipParts = [];
	if (data.fullName) tooltipParts.push(data.fullName);
	if (data.nic) tooltipParts.push(`NIC: ${data.nic}`);
	if (data.alias) tooltipParts.push(`Alias: ${data.alias}`);
	if (data.city) tooltipParts.push(`City: ${data.city}`);

	return (
		<div className="relative h-12 w-12 overflow-visible">
			<Handle
				type="target"
				position={Position.Top}
				id="top"
				className="h-1.5 w-3 !rounded-none !border !border-gray-300 !bg-gray-600/80 shadow-sm"
			/>
			<Handle
				type="target"
				position={Position.Right}
				id="right"
				className="h-1.5 w-3 !rounded-none !border !border-gray-300 !bg-gray-600/80 shadow-sm"
			/>
			<Handle
				type="target"
				position={Position.Bottom}
				id="bottom"
				className="h-1.5 w-3 !rounded-none !border !border-gray-300 !bg-gray-600/80 shadow-sm"
			/>
			<Handle
				type="target"
				position={Position.Left}
				id="left"
				className="h-1.5 w-3 !rounded-none !border !border-gray-300 !bg-gray-600/80 shadow-sm"
			/>
			<Handle
				type="source"
				position={Position.Top}
				id="top"
				className="h-1.5 w-3 !rounded-none !border !border-gray-300 !bg-gray-600/80 shadow-sm"
			/>
			<Handle
				type="source"
				position={Position.Right}
				id="right"
				className="h-1.5 w-3 !rounded-none !border !border-gray-300 !bg-gray-600/80 shadow-sm"
			/>
			<Handle
				type="source"
				position={Position.Bottom}
				id="bottom"
				className="h-1.5 w-3 !rounded-none !border !border-gray-300 !bg-gray-600/80 shadow-sm"
			/>
			<Handle
				type="source"
				position={Position.Left}
				id="left"
				className="h-1.5 w-3 !rounded-none !border !border-gray-300 !bg-gray-600/80 shadow-sm"
			/>

			<div className="h-12 w-12 rounded-full border border-gray-500 bg-white shadow-sm">
				<User className="mx-auto mt-3 h-6 w-6 text-gray-500" />
			</div>

			<div className="absolute -right-5 -top-1 flex items-center gap-1">
				<Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
					<TooltipTrigger asChild>
						<button
							onClick={(e) => {
								e.stopPropagation();
								setTooltipOpen(!tooltipOpen);
							}}
							className="h-4 w-4 shrink-0 cursor-pointer rounded-full bg-white text-gray-500 shadow-sm hover:bg-gray-100 hover:text-gray-700"
							title="Show profile info"
						>
							<CircleHelp className="mx-auto h-2.5 w-2.5" />
						</button>
					</TooltipTrigger>
					<TooltipContent className="rounded-md bg-slate-900 p-3 text-white">
						<div className="space-y-1 text-sm">
							{tooltipParts.map((part, idx) => (
								<div key={idx}>{part}</div>
							))}
						</div>
					</TooltipContent>
				</Tooltip>
			</div>

			<div className="absolute left-1/2 top-full mt-1 w-32 -translate-x-1/2 text-center">
				<div
					className="truncate text-sm font-semibold text-gray-900"
					title={data.fullName || data.label}
				>
					{displayName}
				</div>
				{truncatedSubtitle && (
					<div
						className="truncate text-xs text-gray-500"
						title={displaySubtitle || ""}
					>
						{truncatedSubtitle}
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
	source,
	target,
	data,
	selected,
}: EdgeProps) => {
	const { getNode } = useReactFlow();
	const label = (data?.label as string) || "";

	const sourceNode = getNode(source);
	const targetNode = getNode(target);

	const sourceNodeWidth = sourceNode?.width ?? 48;
	const sourceNodeHeight = sourceNode?.height ?? 48;
	const targetNodeWidth = targetNode?.width ?? 48;
	const targetNodeHeight = targetNode?.height ?? 48;

	// Calculate node centers
	const resolvedSourceX = sourceNode
		? (sourceNode.positionAbsolute?.x ?? sourceNode.position.x) +
			sourceNodeWidth / 2
		: sourceX;
	const resolvedSourceY = sourceNode
		? (sourceNode.positionAbsolute?.y ?? sourceNode.position.y) +
			sourceNodeHeight / 2
		: sourceY;
	const resolvedTargetX = targetNode
		? (targetNode.positionAbsolute?.x ?? targetNode.position.x) +
			targetNodeWidth / 2
		: targetX;
	const resolvedTargetY = targetNode
		? (targetNode.positionAbsolute?.y ?? targetNode.position.y) +
			targetNodeHeight / 2
		: targetY;

	// Calculate direction vector
	const dx = resolvedTargetX - resolvedSourceX;
	const dy = resolvedTargetY - resolvedSourceY;
	const length = Math.sqrt(dx * dx + dy * dy);

	// Node radius (circles are 48px diameter) + arrow offset
	const nodeRadius = 24;
	const arrowOffset = 8; // Extra space for arrow marker

	// Calculate edge endpoints at circle circumference
	const edgeSourceX = resolvedSourceX + (dx / length) * nodeRadius;
	const edgeSourceY = resolvedSourceY + (dy / length) * nodeRadius;
	const edgeTargetX =
		resolvedTargetX - (dx / length) * (nodeRadius + arrowOffset);
	const edgeTargetY =
		resolvedTargetY - (dy / length) * (nodeRadius + arrowOffset);

	const midX = (edgeSourceX + edgeTargetX) / 2;
	const midY = (edgeSourceY + edgeTargetY) / 2;
	const edgePath = `M ${edgeSourceX},${edgeSourceY} L ${edgeTargetX},${edgeTargetY}`;
	const labelX = midX;
	const labelY = midY;

	// Truncate label if longer than 20 characters
	const displayLabel =
		label.length > 20 ? label.substring(0, 20) + "..." : label;

	const gradientId = `edge-gradient-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

	const handleEdgeInfoClick = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		event.preventDefault();
		event.stopPropagation();

		window.dispatchEvent(
			new CustomEvent("open-connection-info-dialog", {
				detail: {
					edgeId: id,
					label,
					source,
					target,
				},
			}),
		);
	};

	const markerId = `arrow-${id}`;

	return (
		<>
			<defs>
				<linearGradient
					id={gradientId}
					x1={resolvedSourceX}
					y1={resolvedSourceY}
					x2={resolvedTargetX}
					y2={resolvedTargetY}
					gradientUnits="userSpaceOnUse"
				>
					<stop
						offset="0%"
						stopColor={selected ? "#2563eb" : "#3b82f6"}
					/>
					<stop
						offset="100%"
						stopColor={selected ? "#dc2626" : "#ef4444"}
					/>
				</linearGradient>
				<marker
					id={markerId}
					viewBox="0 0 10 10"
					refX="5"
					refY="5"
					markerWidth="6"
					markerHeight="6"
					orient="auto"
				>
					<path
						d="M 0 0 L 10 5 L 0 10 z"
						fill={selected ? "#dc2626" : "#ef4444"}
					/>
				</marker>
			</defs>
			<BaseEdge
				id={id}
				path={edgePath}
				markerEnd={`url(#${markerId})`}
				style={{
					stroke: `url(#${gradientId})`,
					strokeWidth: 2,
				}}
			/>
			<EdgeLabelRenderer>
				<div
					style={{
						position: "absolute",
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						pointerEvents: "all",
					}}
					className="nodrag nopan"
				>
					<div
						className="px-2 py-1 bg-white border border-gray-300 text-xs select-none flex items-center gap-1 shadow-sm"
						style={{
							borderRadius: "10px",
							fontSize: "11px",
						}}
					>
						<div className="cursor-default">{displayLabel}</div>
						<button
							type="button"
							onClick={handleEdgeInfoClick}
							className="w-4 h-4 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
							title="View connection details"
						>
							<Info className="h-2.5 w-2.5" />
						</button>
					</div>
				</div>
			</EdgeLabelRenderer>
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
	const [isConnectionInfoDialogOpen, setIsConnectionInfoDialogOpen] =
		useState(false);
	const [connectionInfo, setConnectionInfo] = useState<{
		edgeId: string;
		label: string;
		source: string;
		target: string;
	} | null>(null);
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges] = useEdgesState([]);

	useEffect(() => {
		fetchCaseDetails();
	}, [id]);

	// Set up event listener for connection info dialog
	useEffect(() => {
		const handleOpenConnectionInfoDialog = (event: Event) => {
			const customEvent = event as CustomEvent<{
				edgeId: string;
				label: string;
				source: string;
				target: string;
			}>;

			setConnectionInfo({
				edgeId: customEvent.detail.edgeId,
				label: customEvent.detail.label || "",
				source: customEvent.detail.source,
				target: customEvent.detail.target,
			});
			setIsConnectionInfoDialogOpen(true);
		};

		window.addEventListener(
			"open-connection-info-dialog",
			handleOpenConnectionInfoDialog,
		);

		return () => {
			window.removeEventListener(
				"open-connection-info-dialog",
				handleOpenConnectionInfoDialog,
			);
		};
	}, []);

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

			// Generate random non-overlapping positions
			const generateNonOverlappingPosition = (
				existingPositions: { x: number; y: number }[],
				canvasWidth: number,
				canvasHeight: number,
				minDistance: number,
			): { x: number; y: number } => {
				const margin = 100;
				const maxAttempts = 300;
				const maxCollinearDeviation = 0.14;

				for (let attempt = 0; attempt < maxAttempts; attempt++) {
					const x =
						margin + Math.random() * (canvasWidth - 2 * margin);
					const y =
						margin + Math.random() * (canvasHeight - 2 * margin);

					// Check if this position is far enough from all existing positions
					const isFarEnough = existingPositions.every((pos) => {
						const dx = pos.x - x;
						const dy = pos.y - y;
						const distance = Math.sqrt(dx * dx + dy * dy);
						return distance >= minDistance;
					});

					if (!isFarEnough) {
						continue;
					}

					// Prevent 3 nodes from aligning on almost the same straight line
					let createsCollinearTriple = false;
					for (
						let i = 0;
						i < existingPositions.length - 1 &&
						!createsCollinearTriple;
						i++
					) {
						for (let j = i + 1; j < existingPositions.length; j++) {
							const p1 = existingPositions[i];
							const p2 = existingPositions[j];

							const lineDx = p2.x - p1.x;
							const lineDy = p2.y - p1.y;
							const lineLength = Math.sqrt(
								lineDx * lineDx + lineDy * lineDy,
							);

							if (lineLength < 1) {
								continue;
							}

							const areaTwice = Math.abs(
								lineDx * (y - p1.y) - lineDy * (x - p1.x),
							);
							const deviation = areaTwice / lineLength;

							if (
								deviation <
								minDistance * maxCollinearDeviation
							) {
								createsCollinearTriple = true;
								break;
							}
						}
					}

					if (!createsCollinearTriple) {
						return { x, y };
					}
				}

				// Fallback: return a position even if not ideal
				return {
					x: margin + Math.random() * (canvasWidth - 2 * margin),
					y: margin + Math.random() * (canvasHeight - 2 * margin),
				};
			};

			const canvasWidth = 1200;
			const canvasHeight = 500;
			const minDistance = 200; // Minimum distance between node centers

			const positions: { x: number; y: number }[] = [];

			// Create nodes from profiles with full details
			const newNodes: Node[] = profiles.map((profile, idx) => {
				const fullProfile = profileDetails[idx];
				const position = generateNonOverlappingPosition(
					positions,
					canvasWidth,
					canvasHeight,
					minDistance,
				);
				positions.push(position);

				return {
					id: profile[0].toString(),
					data: {
						label: profile[1],
						fullName: fullProfile?.full_name || profile[1],
						nic: fullProfile?.nic || null,
						alias: fullProfile?.alias || null,
						city: fullProfile?.city || null,
					},
					position,
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
								<Pencil className="h-4 w-4 mr-2" />
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
									onNodesChange={onNodesChange}
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

			{/* Connection Info Dialog */}
			<Dialog
				open={isConnectionInfoDialogOpen}
				onOpenChange={setIsConnectionInfoDialogOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Connection Details</DialogTitle>
						<DialogDescription>
							View connection information between profiles
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						{connectionInfo && (
							<div className="bg-muted p-3 rounded-md text-sm">
								<div className="flex items-center justify-between gap-2">
									<div className="flex min-w-0 items-center gap-2">
										<span
											className="font-medium truncate max-w-45"
											title={
												nodes.find(
													(n) =>
														n.id ===
														connectionInfo.source,
												)?.data?.label as string
											}
										>
											{
												nodes.find(
													(n) =>
														n.id ===
														connectionInfo.source,
												)?.data?.label as string
											}
										</span>
										<span className="text-muted-foreground shrink-0">
											→
										</span>
										<span
											className="font-medium truncate max-w-45"
											title={
												nodes.find(
													(n) =>
														n.id ===
														connectionInfo.target,
												)?.data?.label as string
											}
										>
											{
												nodes.find(
													(n) =>
														n.id ===
														connectionInfo.target,
												)?.data?.label as string
											}
										</span>
									</div>
								</div>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="connection-type-readonly">
								Connection Type
							</Label>
							<Input
								id="connection-type-readonly"
								value={connectionInfo?.label || ""}
								readOnly
								disabled
								className="bg-gray-50 cursor-not-allowed"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							className="cursor-pointer"
							onClick={() => setIsConnectionInfoDialogOpen(false)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
