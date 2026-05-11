import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	createCaseWithAreas,
	updateCase,
	getCase,
	getCaseAreas,
	getCaseRelationships,
	getCaseProfiles,
	searchCases,
	saveCaseRelationships,
	assignCaseToProfile,
	linkCaseToArea,
	type CaseWithDetails,
	type CaseRelationshipData,
} from "@/lib/cases";
import { getAllAreas, getAreaByName, createArea, type Area } from "@/lib/areas";
import {
	getAllDrugs,
	saveCaseDrugs,
	getCaseDrugs,
	type Drug,
	type CaseDrugData,
} from "@/lib/drugs";
import {
	createProfile,
	getAllProfiles,
	getProfile,
	getProfileRelationships,
	type ProfileWithId,
} from "@/lib/profiles";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Background,
	BackgroundVariant,
	ConnectionLineType,
	Controls,
	Handle,
	MarkerType,
	MiniMap,
	Position,
	addEdge,
	Connection,
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
	Calendar,
	Check,
	ChevronLeft,
	CircleHelp,
	Clock,
	FileText,
	MapPin,
	MessageSquare,
	Pencil,
	Pill,
	Trash2,
	User,
	UserPlus,
	UserSearch,
	X,
	Network,
} from "lucide-react";
import { toast } from "sonner";

const BubbleProfileNode = ({
	data,
	id,
}: {
	data: {
		label: string;
		profileId?: number;
		fullName?: string;
		alias?: string | null;
		nic?: string | null;
		city?: string | null;
		isCurrentProfile?: boolean;
		onDelete?: (id: string) => void;
		edges?: Edge[];
	};
	id: string;
	isSelected?: boolean;
}) => {
	const [tooltipOpen, setTooltipOpen] = useState(false);

	const connectionCount = data.edges
		? data.edges.filter((edge) => edge.source === id || edge.target === id)
				.length
		: 0;

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

			<div
				className={
					data.isCurrentProfile
						? "h-12 w-12 rounded-full border-2 border-gray-700 bg-white shadow-sm"
						: "h-12 w-12 rounded-full border border-gray-500 bg-white shadow-sm"
				}
			>
				<User
					className={
						data.isCurrentProfile
							? "mx-auto mt-3 h-6 w-6 text-gray-700"
							: "mx-auto mt-3 h-6 w-6 text-gray-500"
					}
				/>
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

				{data.onDelete && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<button
								onClick={(e) => {
									e.stopPropagation();
								}}
								className="h-4 w-4 shrink-0 cursor-pointer rounded-full bg-white text-gray-500 shadow-sm hover:bg-red-100 hover:text-red-600"
								title="Delete profile"
							>
								<Trash2 className="mx-auto h-2.5 w-2.5" />
							</button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Delete Profile
								</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete this
									profile?
									{connectionCount > 0 && (
										<>
											{" "}
											This profile has{" "}
											<span className="font-semibold">
												{connectionCount}{" "}
												{connectionCount === 1
													? "connection"
													: "connections"}
											</span>{" "}
											that will also be removed.
										</>
									)}{" "}
									This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel className="cursor-pointer">
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction
									className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
									onClick={(e: React.MouseEvent) => {
										e.preventDefault();
										e.stopPropagation();
										data.onDelete?.(id);
									}}
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
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

const CustomEdge = ({
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
	const readonly = data?.readonly || false;

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

	const handleEdgeEditClick = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		event.preventDefault();
		event.stopPropagation();

		window.dispatchEvent(
			new CustomEvent("open-connection-edit-dialog", {
				detail: {
					edgeId: id,
					label,
					source,
					target,
					sourceHandle: null,
					targetHandle: null,
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
					{readonly ? (
						<>
							<stop
								offset="0%"
								stopColor={selected ? "#4b5563" : "#d1d5db"}
							/>
							<stop
								offset="100%"
								stopColor={selected ? "#1f2937" : "#6b7280"}
							/>
						</>
					) : (
						<>
							<stop
								offset="0%"
								stopColor={selected ? "#2563eb" : "#3b82f6"}
							/>
							<stop
								offset="100%"
								stopColor={selected ? "#dc2626" : "#ef4444"}
							/>
						</>
					)}
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
						fill={
							readonly
								? selected
									? "#1f2937"
									: "#6b7280"
								: selected
									? "#dc2626"
									: "#ef4444"
						}
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
						{readonly && data?.linkedCaseId && (
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									window.dispatchEvent(
										new CustomEvent(
											"open-relationship-info-dialog",
											{
												detail: {
													linkedCaseId:
														data.linkedCaseId,
													relationshipType:
														data.label,
												},
											},
										),
									);
								}}
								className="w-4 h-4 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
								title="View related case"
							>
								<CircleHelp className="h-2.5 w-2.5" />
							</button>
						)}
						{!readonly && (
							<button
								type="button"
								onClick={handleEdgeEditClick}
								className="w-4 h-4 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
								title="Edit connection"
							>
								<Pencil className="h-2.5 w-2.5" />
							</button>
						)}
					</div>
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

const nodeTypes = {
	custom: BubbleProfileNode,
};

const edgeTypes = {
	custom: CustomEdge,
};

/**
 * Fuzzy match search term against target string
 * Returns { match: boolean, score: number } where higher score = better match
 * Scoring: exact match > starts with > fuzzy sequence match
 */
function fuzzyMatch(
	search: string,
	target: string,
): { match: boolean; score: number } {
	const searchLower = search.toLowerCase().trim();
	const targetLower = target.toLowerCase();

	if (!searchLower) return { match: true, score: 0 };

	// Exact match - highest score
	if (targetLower === searchLower) {
		return { match: true, score: 1000 };
	}

	// Starts with - high score
	if (targetLower.startsWith(searchLower)) {
		return { match: true, score: 500 };
	}

	// Contains substring - medium score
	if (targetLower.includes(searchLower)) {
		return { match: true, score: 250 };
	}

	// Fuzzy sequence match (characters appear in order)
	let searchIndex = 0;
	let lastMatchIndex = -1;
	let consecutiveMatches = 0;
	let totalGaps = 0;

	for (
		let i = 0;
		i < targetLower.length && searchIndex < searchLower.length;
		i++
	) {
		if (targetLower[i] === searchLower[searchIndex]) {
			if (i === lastMatchIndex + 1) {
				consecutiveMatches++;
			}
			if (lastMatchIndex >= 0) {
				totalGaps += i - lastMatchIndex - 1;
			}
			lastMatchIndex = i;
			searchIndex++;
		}
	}

	// All characters found in sequence
	if (searchIndex === searchLower.length) {
		// Better score for consecutive matches and fewer gaps
		const score = 100 + consecutiveMatches * 10 - totalGaps;
		return { match: true, score: Math.max(score, 1) };
	}

	return { match: false, score: 0 };
}

export default function NewCasePage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams<{ id: string }>();
	const isEditMode = Boolean(id);
	const [isLoading, setIsLoading] = useState(false);

	type NewCaseLocationState = {
		defaultProfile?: ProfileWithId;
	} | null;
	const defaultProfile = (location.state as NewCaseLocationState)
		?.defaultProfile;
	const hasDefaultProfile = Boolean(defaultProfile);
	const [caseNotes, setCaseNotes] = useState("");
	const [caseId, setCaseId] = useState("");
	const [caseTitle, setCaseTitle] = useState("");
	const [caseDescription, setCaseDescription] = useState("");
	const [severityLevel, setSeverityLevel] = useState("");
	const [caseType, setCaseType] = useState("");
	const [caseStatus, setCaseStatus] = useState("");
	const [caseDate, setCaseDate] = useState("");
	const [caseTime, setCaseTime] = useState("");
	const [caseSearchQuery, setCaseSearchQuery] = useState("");
	const [caseSearchResults, setCaseSearchResults] = useState<
		CaseWithDetails[]
	>([]);
	const [isSearchingCases, setIsSearchingCases] = useState(false);
	const [attachedCases, setAttachedCases] = useState<CaseWithDetails[]>([]);
	const [activeAccordion, setActiveAccordion] = useState("");
	const [completedSections] = useState<string[]>([]);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
	const [selectedDrugs, setSelectedDrugs] = useState<{
		[key: number]: string;
	}>({});
	const [drugSearch, setDrugSearch] = useState("");
	const [availableDrugs, setAvailableDrugs] = useState<Drug[]>([]);
	const [areas, setAreas] = useState<string[]>([]);
	const [pendingArea, setPendingArea] = useState("");
	const [availableAreas, setAvailableAreas] = useState<Area[]>([]);

	const [isAddProfileDialogOpen, setIsAddProfileDialogOpen] = useState(false);
	const [availableProfiles, setAvailableProfiles] = useState<ProfileWithId[]>(
		[],
	);
	const [profileSearch, setProfileSearch] = useState("");
	const [isNewProfileDialogOpen, setIsNewProfileDialogOpen] = useState(false);
	const [newProfileFullName, setNewProfileFullName] = useState("");
	const [newProfileAlias, setNewProfileAlias] = useState("");
	const [newProfileNic, setNewProfileNic] = useState("");
	const [newProfileAddressLine1, setNewProfileAddressLine1] = useState("");
	const [newProfileAddressLine2, setNewProfileAddressLine2] = useState("");
	const [newProfileCity, setNewProfileCity] = useState("");
	const [newProfileNotes, setNewProfileNotes] = useState("");
	const [isCreatingProfile, setIsCreatingProfile] = useState(false);
	const newProfileNotesRef = useRef<HTMLTextAreaElement>(null);

	const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
	const [pendingConnection, setPendingConnection] = useState<
		Connection | Edge | null
	>(null);
	const [connectionLabel, setConnectionLabel] = useState("");
	const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
	const [isValidConnection, setIsValidConnection] = useState(false);

	const [isRelationshipInfoDialogOpen, setIsRelationshipInfoDialogOpen] =
		useState(false);
	const [, setRelationshipInfoData] = useState<{
		linkedCaseId: number | null;
		relationshipType: string;
	} | null>(null);
	const [relationshipCaseData, setRelationshipCaseData] = useState<any>(null);
	const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

	const initialNodes: Node[] =
		hasDefaultProfile && defaultProfile
			? [
					{
						id: "1",
						type: "custom",
						data: {
							label: defaultProfile.full_name,
							profileId: defaultProfile.id,
							fullName: defaultProfile.full_name,
							nic: defaultProfile.nic,
							alias: defaultProfile.alias,
							city: defaultProfile.city,
							isCurrentProfile: true,
							edges: [],
						},
						position: { x: 400, y: 200 },
					},
				]
			: [];
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [nodeId, setNodeId] = useState(hasDefaultProfile ? 2 : 1);

	const hasConnectionBetweenProfiles = useCallback(
		(sourceId?: string | null, targetId?: string | null) => {
			if (!sourceId || !targetId) return false;

			return edges.some(
				(edge) =>
					(edge.source === sourceId && edge.target === targetId) ||
					(edge.source === targetId && edge.target === sourceId),
			);
		},
		[edges],
	);

	useEffect(() => {
		const handleOpenConnectionEditDialog = (event: Event) => {
			const customEvent = event as CustomEvent<{
				edgeId: string;
				label: string;
				source: string;
				target: string;
				sourceHandle?: string | null;
				targetHandle?: string | null;
			}>;

			setEditingEdgeId(customEvent.detail.edgeId);
			setConnectionLabel(customEvent.detail.label || "");
			setPendingConnection({
				source: customEvent.detail.source,
				target: customEvent.detail.target,
				sourceHandle: customEvent.detail.sourceHandle ?? null,
				targetHandle: customEvent.detail.targetHandle ?? null,
			});
			setIsConnectionDialogOpen(true);
		};

		const handleOpenRelationshipInfoDialog = (event: Event) => {
			const customEvent = event as CustomEvent<{
				linkedCaseId: number | null;
				relationshipType: string;
			}>;

			setRelationshipInfoData({
				linkedCaseId: customEvent.detail.linkedCaseId,
				relationshipType: customEvent.detail.relationshipType,
			});
			setIsRelationshipInfoDialogOpen(true);

			// Load case data and related metadata
			if (customEvent.detail.linkedCaseId) {
				Promise.all([
					getCase(customEvent.detail.linkedCaseId),
					getCaseDrugs(customEvent.detail.linkedCaseId),
					getCaseAreas(customEvent.detail.linkedCaseId),
					getCaseProfiles(customEvent.detail.linkedCaseId),
				])
					.then(([caseData, drugsData, areasData, profilesData]) => {
						setRelationshipCaseData({
							...caseData,
							drugs: drugsData,
							areas: areasData,
							profiles: profilesData,
						});
					})
					.catch((error) => {
						console.error("Failed to load case data:", error);
						toast.error("Failed to load case information", {
							position: "top-center",
						});
					});
			}
		};

		window.addEventListener(
			"open-connection-edit-dialog",
			handleOpenConnectionEditDialog,
		);
		window.addEventListener(
			"open-relationship-info-dialog",
			handleOpenRelationshipInfoDialog,
		);

		return () => {
			window.removeEventListener(
				"open-connection-edit-dialog",
				handleOpenConnectionEditDialog,
			);
			window.removeEventListener(
				"open-relationship-info-dialog",
				handleOpenRelationshipInfoDialog,
			);
		};
	}, []);

	// Load case data when in edit mode
	useEffect(() => {
		if (isEditMode && id) {
			const loadCaseData = async () => {
				setIsLoading(true);
				try {
					const caseNumId = parseInt(id, 10);

					// Load case details
					const caseData = await getCase(caseNumId);
					if (!caseData) {
						toast.error("Case not found", {
							position: "top-center",
						});
						navigate("/cases");
						return;
					}

					// Populate case fields
					setCaseId(caseData.case_id || "");
					setCaseTitle(caseData.case_name);
					setCaseDescription(caseData.description || "");
					setCaseType(caseData.case_type || "");
					setCaseStatus(caseData.status || "");
					setSeverityLevel(caseData.severity_level || "");
					setCaseNotes(caseData.notes || "");
					setCaseDate(caseData.case_date || "");
					setCaseTime(caseData.case_time || "");

					// Load areas
					const caseAreas = await getCaseAreas(caseNumId);
					setAreas(caseAreas);

					// Load drugs
					const caseDrugs = await getCaseDrugs(caseNumId);
					const drugsMap: { [key: number]: string } = {};
					caseDrugs.forEach((drug) => {
						drugsMap[drug.drug_id] = drug.quantity;
					});
					setSelectedDrugs(drugsMap);

					// Load profiles and relationships
					const caseProfiles = await getCaseProfiles(caseNumId);
					const relationships = await getCaseRelationships(caseNumId);

					// Create nodes for each profile
					const profileNodes: Node[] = [];
					let nextNodeId = 1;
					for (const [profileId] of caseProfiles) {
						const profile = await getProfile(profileId);
						if (profile) {
							profileNodes.push({
								id: String(nextNodeId),
								type: "custom",
								data: {
									label: profile.full_name,
									profileId: profile.id,
									fullName: profile.full_name,
									nic: profile.nic,
									alias: profile.alias,
									city: profile.city,
									isCurrentProfile: false,
									edges: [],
								},
								position: {
									x: 200 + (nextNodeId - 1) * 150,
									y: 200 + ((nextNodeId - 1) % 3) * 100,
								},
							});
							nextNodeId++;
						}
					}
					setNodes(profileNodes);
					setNodeId(nextNodeId);

					// Create edges for relationships
					const profileIdToNodeId = new Map<number, string>();
					profileNodes.forEach((node) => {
						if (node.data.profileId) {
							profileIdToNodeId.set(node.data.profileId, node.id);
						}
					});

					const relationshipEdges: Edge[] = relationships
						.map((rel, idx) => {
							const sourceNodeId = profileIdToNodeId.get(
								rel.source_profile_id,
							);
							const targetNodeId = profileIdToNodeId.get(
								rel.target_profile_id,
							);

							return {
								id: `e${idx + 1}`,
								source: sourceNodeId || "",
								target: targetNodeId || "",
								type: "custom",
								markerEnd: {
									type: MarkerType.ArrowClosed,
									width: 20,
									height: 20,
									color: "#9CA3AF",
								},
								data: {
									label: rel.relationship_type || "",
								},
							};
						})
						.filter((edge) => edge.source && edge.target);

					setEdges(relationshipEdges);
				} catch (error) {
					console.error("Failed to load case:", error);
					toast.error("Failed to load case data", {
						position: "top-center",
					});
				} finally {
					setIsLoading(false);
				}
			};

			loadCaseData();
		}
	}, [isEditMode, id, navigate]);

	const getDrugDisplayName = (drug: Drug) => {
		return `${drug.name} (${drug.quantified_by})`;
	};

	const isValidDrugQuantity = (value: string) => {
		return /^(\d+(\.\d+)?|\.\d+)$/.test(value);
	};

	const handleDrugSelect = (drugId: number) => {
		if (!selectedDrugs[drugId]) {
			setSelectedDrugs({ ...selectedDrugs, [drugId]: "" });
		}
		setDrugSearch("");
	};

	const handleDrugQuantityChange = (drugId: number, quantity: string) => {
		setSelectedDrugs({ ...selectedDrugs, [drugId]: quantity });
	};

	const handleRemoveDrug = (drugId: number) => {
		const updatedDrugs = { ...selectedDrugs };
		delete updatedDrugs[drugId];
		setSelectedDrugs(updatedDrugs);
	};

	const onConnect = useCallback(
		(params: Connection | Edge) => {
			if (params.source === params.target) {
				toast.error("A profile cannot connect to itself", {
					position: "top-center",
				});
				return;
			}

			const connectionExists = hasConnectionBetweenProfiles(
				params.source,
				params.target,
			);

			if (connectionExists) {
				toast.error(
					"A connection already exists between these profiles",
					{
						position: "top-center",
					},
				);
				return;
			}

			setPendingConnection(params);
			setConnectionLabel("supporter");
			setIsConnectionDialogOpen(true);
		},
		[hasConnectionBetweenProfiles],
	);

	const onEdgeClick = useCallback((event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
	}, []);

	const onConnectStart = useCallback(() => {
		setIsValidConnection(false);
	}, []);

	const onConnectEnd = useCallback(() => {
		setIsValidConnection(false);
	}, []);

	const isValidConnectionCheck = useCallback(
		(connection: Connection | Edge) => {
			const isValid =
				connection.source !== connection.target &&
				!hasConnectionBetweenProfiles(
					connection.source,
					connection.target,
				);
			setIsValidConnection(isValid);
			return isValid;
		},
		[hasConnectionBetweenProfiles],
	);

	const handleConnectionSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (connectionLabel.trim()) {
			if (editingEdgeId) {
				setEdges((eds) =>
					eds.map((edge) =>
						edge.id === editingEdgeId
							? {
									...edge,
									label: connectionLabel.trim(),
									data: {
										...edge.data,
										label: connectionLabel.trim(),
									},
								}
							: edge,
					),
				);
			} else if (pendingConnection) {
				if (
					hasConnectionBetweenProfiles(
						pendingConnection.source,
						pendingConnection.target,
					)
				) {
					toast.error(
						"A connection already exists between these profiles",
						{
							position: "top-center",
						},
					);
					return;
				}

				const sourceNode = nodes.find(
					(n) => n.id === pendingConnection.source,
				);
				const targetNode = nodes.find(
					(n) => n.id === pendingConnection.target,
				);
				const sourceNodeName =
					sourceNode?.data?.fullName || sourceNode?.data?.label || "";
				const targetNodeName =
					targetNode?.data?.fullName || targetNode?.data?.label || "";

				const newEdge = {
					...pendingConnection,
					label: connectionLabel.trim(),
					type: "custom",
					markerEnd: {
						type: MarkerType.ArrowClosed,
					},
					style: { strokeWidth: 2 },
					data: {
						label: connectionLabel.trim(),
						sourceNode: sourceNodeName,
						targetNode: targetNodeName,
					},
				};
				setEdges((eds) => addEdge(newEdge, eds));
			}
			setIsConnectionDialogOpen(false);
			setPendingConnection(null);
			setConnectionLabel("");
			setEditingEdgeId(null);
		}
	};

	const handleConnectionDelete = () => {
		if (editingEdgeId) {
			setEdges((eds) => eds.filter((edge) => edge.id !== editingEdgeId));
			setIsConnectionDialogOpen(false);
			setPendingConnection(null);
			setConnectionLabel("");
			setEditingEdgeId(null);
		}
	};

	const handleNodeDelete = useCallback(
		(nodeIdToDelete: string) => {
			setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
			setEdges((eds) =>
				eds.filter(
					(edge) =>
						edge.source !== nodeIdToDelete &&
						edge.target !== nodeIdToDelete,
				),
			);
		},
		[setNodes, setEdges],
	);

	// Add delete callback to initial default profile node
	useEffect(() => {
		if (hasDefaultProfile) {
			setNodes((nds) =>
				nds.map((node) =>
					node.id === "1"
						? {
								...node,
								data: {
									...node.data,
									onDelete: handleNodeDelete,
								},
							}
						: node,
				),
			);
		}
	}, [hasDefaultProfile, setNodes, handleNodeDelete]);

	const addNode = useCallback(
		(profile: ProfileWithId) => {
			// Check if profile is already on canvas
			const profileExists = nodes.some(
				(node) => node.data?.profileId === profile.id,
			);

			if (profileExists) {
				toast.error("Profile already added to canvas");
				return;
			}

			const displayName = profile.alias
				? `${profile.full_name} (${profile.alias})`
				: profile.full_name;

			const newNode: Node = {
				id: `${nodeId}`,
				type: "custom",
				data: {
					label: displayName,
					profileId: profile.id,
					fullName: profile.full_name,
					nic: profile.nic,
					alias: profile.alias,
					city: profile.city,
					onDelete: handleNodeDelete,
					edges,
				},
				position: {
					x: Math.random() * 400 + 100,
					y: Math.random() * 400 + 50,
				},
			};
			setNodes((nds) => [...nds, newNode]);
			setNodeId((id) => id + 1);
		},
		[nodeId, nodes, setNodes, handleNodeDelete, edges],
	);

	useEffect(() => {
		setNodes((nds) =>
			nds.map((node) => ({
				...node,
				data: {
					...node.data,
					edges,
				},
			})),
		);
	}, [edges]);

	// Create stable dependency that only changes when node IDs/profileIds change, not when node data changes
	const nodeProfileKey = useMemo(
		() =>
			nodes
				.map((n) => `${n.id}-${n.data?.profileId}`)
				.sort()
				.join(","),
		[nodes],
	);

	// Load existing relationships between profiles when nodes change
	useEffect(() => {
		const loadExistingRelationships = async () => {
			if (nodes.length < 2) {
				// Remove any readonly edges if we have less than 2 nodes
				setEdges((eds) => eds.filter((edge) => !edge.data?.readonly));
				return;
			}

			const profileIds = nodes
				.map((node) => node.data?.profileId)
				.filter((id): id is number => typeof id === "number");

			if (profileIds.length < 2) return;

			try {
				// Get all relationships for all profiles
				const relationshipsData = await Promise.all(
					profileIds.map(async (profileId) => {
						const relationships =
							await getProfileRelationships(profileId);
						return { profileId, relationships };
					}),
				);

				// Use functional form of setEdges to get current edges
				setEdges((currentEdges) => {
					// Create a map of existing edges (non-readonly) to avoid duplicates
					const existingEdgePairs = new Set(
						currentEdges
							.filter((edge) => !edge.data?.readonly)
							.map((edge) => `${edge.source}-${edge.target}`),
					);

					const readonlyEdges: Edge[] = [];

					// Check each pair of profiles
					for (let i = 0; i < profileIds.length; i++) {
						const sourceProfileId = profileIds[i];
						const sourceNode = nodes.find(
							(n) => n.data?.profileId === sourceProfileId,
						);
						if (!sourceNode) continue;

						const profileRelationships = relationshipsData.find(
							(r) => r.profileId === sourceProfileId,
						);
						if (!profileRelationships) continue;

						for (const relationship of profileRelationships.relationships) {
							const targetNode = nodes.find(
								(n) =>
									n.data?.profileId ===
									relationship.target_profile_id,
							);
							if (!targetNode) continue;

							const edgeKey = `${sourceNode.id}-${targetNode.id}`;
							const reverseEdgeKey = `${targetNode.id}-${sourceNode.id}`;

							// Only add if this edge pair doesn't already exist as a user-created edge
							if (
								!existingEdgePairs.has(edgeKey) &&
								!existingEdgePairs.has(reverseEdgeKey)
							) {
								readonlyEdges.push({
									id: `readonly-${sourceProfileId}-${relationship.target_profile_id}`,
									source: sourceNode.id,
									target: targetNode.id,
									type: "custom",
									data: {
										readonly: true,
										label:
											relationship.relationship_type ||
											"Connected",
										relationshipType:
											relationship.relationship_type,
										linkedCaseId:
											relationship.linked_case_id,
									},
									style: {
										stroke: "#9ca3af",
										strokeWidth: 2,
										strokeDasharray: "5,5",
									},
									markerEnd: {
										type: MarkerType.ArrowClosed,
										color: "#9ca3af",
									},
								});
								// Mark this pair as used
								existingEdgePairs.add(edgeKey);
								existingEdgePairs.add(reverseEdgeKey);
							}
						}
					}

					// Return new edges array: remove old readonly edges and add new ones
					return [
						...currentEdges.filter((edge) => !edge.data?.readonly),
						...readonlyEdges,
					];
				});
			} catch (error) {
				console.error("Failed to load existing relationships:", error);
			}
		};

		loadExistingRelationships();
	}, [nodeProfileKey]);

	const handleTextareaResize = (
		ref: React.RefObject<HTMLTextAreaElement | null>,
	) => {
		if (ref.current) {
			ref.current.style.height = "auto";
			ref.current.style.height = `${ref.current.scrollHeight}px`;
		}
	};

	useEffect(() => {
		handleTextareaResize(textareaRef);
	}, [caseNotes]);

	useEffect(() => {
		handleTextareaResize(descriptionTextareaRef);
	}, [caseDescription]);

	useEffect(() => {
		handleTextareaResize(newProfileNotesRef);
	}, [newProfileNotes]);

	const runCaseSearch = useCallback(async (query: string) => {
		const trimmedQuery = query.trim();
		if (trimmedQuery.length < 2) {
			setCaseSearchResults([]);
			setIsSearchingCases(false);
			return;
		}

		setIsSearchingCases(true);
		try {
			const results = await searchCases(trimmedQuery);
			setCaseSearchResults(results);
		} catch (error) {
			console.error("Failed to search cases:", error);
			setCaseSearchResults([]);
		} finally {
			setIsSearchingCases(false);
		}
	}, []);

	useEffect(() => {
		const trimmedQuery = caseSearchQuery.trim();
		if (trimmedQuery.length < 2) {
			setCaseSearchResults([]);
			setIsSearchingCases(false);
			return;
		}

		const timeoutId = window.setTimeout(() => {
			void runCaseSearch(trimmedQuery);
		}, 250);

		return () => window.clearTimeout(timeoutId);
	}, [caseSearchQuery, runCaseSearch]);

	const fetchProfiles = useCallback(async () => {
		try {
			const allProfiles = await getAllProfiles();
			setAvailableProfiles(allProfiles);
		} catch (error) {
			console.error("Failed to fetch profiles:", error);
		}
	}, []);

	const resetNewProfileForm = useCallback(() => {
		setNewProfileFullName("");
		setNewProfileAlias("");
		setNewProfileNic("");
		setNewProfileAddressLine1("");
		setNewProfileAddressLine2("");
		setNewProfileCity("");
		setNewProfileNotes("");
	}, []);

	const handleCreateNewProfile = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!newProfileFullName.trim()) {
			toast.error("Full name is required", {
				position: "top-center",
			});
			return;
		}

		setIsCreatingProfile(true);
		try {
			const profilePayload = {
				full_name: newProfileFullName.trim(),
				alias: newProfileAlias.trim() || null,
				nic: newProfileNic.trim() || null,
				address_line1: newProfileAddressLine1.trim() || null,
				address_line2: newProfileAddressLine2.trim() || null,
				city: newProfileCity.trim() || null,
				notes: newProfileNotes.trim() || null,
			};

			const createdId = await createProfile(profilePayload);
			const createdProfile: ProfileWithId = {
				id: createdId,
				full_name: profilePayload.full_name,
				alias: profilePayload.alias,
				nic: profilePayload.nic,
				address_line1: profilePayload.address_line1,
				address_line2: profilePayload.address_line2,
				city: profilePayload.city,
				risk_level: null,
				status: null,
				notes: profilePayload.notes,
				created_at: null,
				updated_at: null,
			};

			addNode(createdProfile);
			setAvailableProfiles((prev) => [createdProfile, ...prev]);
			setIsNewProfileDialogOpen(false);
			resetNewProfileForm();
			setProfileSearch("");
			fetchProfiles();

			toast.success("Profile created and added to network", {
				position: "top-center",
			});
		} catch (error) {
			console.error("Failed to create profile:", error);
			toast.error("Failed to create profile", {
				position: "top-center",
			});
		} finally {
			setIsCreatingProfile(false);
		}
	};

	// Fetch available areas, drugs, and profiles on mount
	useEffect(() => {
		const fetchAreas = async () => {
			try {
				const allAreas = await getAllAreas();
				setAvailableAreas(allAreas);
			} catch (error) {
				console.error("Failed to fetch areas:", error);
			}
		};

		const fetchDrugs = async () => {
			try {
				const drugs = await getAllDrugs();
				setAvailableDrugs(drugs);
			} catch (error) {
				console.error("Failed to fetch drugs:", error);
			}
		};

		fetchAreas();
		fetchDrugs();
		fetchProfiles();
	}, [fetchProfiles]);

	const clearAll = () => {
		setCaseNotes("");
		setCaseId("");
		setCaseTitle("");
		setCaseDescription("");
		setSeverityLevel("");
		setCaseType("");
		setCaseStatus("");
		setCaseDate("");
		setCaseTime("");
		setCaseSearchQuery("");
		setCaseSearchResults([]);
		setAttachedCases([]);
		setIsSearchingCases(false);
		setActiveAccordion("");
		setSelectedDrugs({});
		setDrugSearch("");
		setAreas([]);
		setPendingArea("");
		setNodes(initialNodes);
		setEdges([]);
		setNodeId(hasDefaultProfile ? 2 : 1);
		setPendingConnection(null);
		setConnectionLabel("");
		setEditingEdgeId(null);
		setIsConnectionDialogOpen(false);
		setIsAddProfileDialogOpen(false);
		setProfileSearch("");
		setIsNewProfileDialogOpen(false);
		resetNewProfileForm();
		setIsRelationshipInfoDialogOpen(false);
		setRelationshipInfoData(null);
		setRelationshipCaseData(null);
		setIsClearAllDialogOpen(false);

		toast.success("Draft case cleared", {
			position: "top-center",
		});
	};

	const caseDetailsTotalFields = 8;
	const caseDetailsFilledFields = [
		caseId,
		caseType,
		caseTitle,
		caseDescription,
		caseDate,
		caseTime,
		severityLevel,
		caseStatus,
	].filter((value) => value.trim().length > 0).length;

	const hasDraftData =
		caseId.trim().length > 0 ||
		caseTitle.trim().length > 0 ||
		caseDescription.trim().length > 0 ||
		caseNotes.trim().length > 0 ||
		caseType.trim().length > 0 ||
		caseStatus.trim().length > 0 ||
		severityLevel.trim().length > 0 ||
		caseDate.trim().length > 0 ||
		caseTime.trim().length > 0 ||
		caseSearchQuery.trim().length > 0 ||
		drugSearch.trim().length > 0 ||
		pendingArea.trim().length > 0 ||
		attachedCases.length > 0 ||
		Object.keys(selectedDrugs).length > 0 ||
		areas.length > 0 ||
		edges.length > 0 ||
		nodes.length !== initialNodes.length;

	return (
		<div className="w-full mx-auto space-y-1">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">
					{isEditMode ? "Edit Case" : "File New Case"}
				</h2>
				<Button
					type="button"
					variant="outline"
					className="cursor-pointer"
					onClick={() => navigate(-1)}
				>
					<ChevronLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
			</div>
			<p className="text-sm text-gray-500">
				{isEditMode
					? "Update the case details and network below."
					: "Complete the following steps to file a new case for this profile."}
			</p>

			{isLoading ? (
				<div className="flex items-center justify-center h-64">
					<p className="text-gray-500">Loading case data...</p>
				</div>
			) : (
				<form
					onSubmit={async (e) => {
						e.preventDefault();

						const normalizedCaseTitle = caseTitle.trim();
						if (!normalizedCaseTitle) {
							toast.error("Case title is required", {
								position: "top-center",
							});
							return;
						}

						// Validate at least one profile exists
						if (nodes.length === 0) {
							toast.error(
								"Please add at least one profile to the network",
								{
									position: "top-center",
								},
							);
							return;
						}

						const invalidDrugQuantity = Object.entries(
							selectedDrugs,
						).find(
							([_, quantity]) =>
								quantity.trim() !== "" &&
								!isValidDrugQuantity(quantity.trim()),
						);

						if (invalidDrugQuantity) {
							toast.error(
								"Drug quantity must be a valid number",
								{
									position: "top-center",
								},
							);
							return;
						}

						try {
							let targetCaseId: number;

							if (isEditMode && id) {
								// Update existing case
								targetCaseId = parseInt(id, 10);

								const caseData = {
									case_id: caseId || null,
									case_name: normalizedCaseTitle,
									description: caseDescription || null,
									case_type: caseType || null,
									status: caseStatus || null,
									severity_level: severityLevel || null,
									notes: caseNotes || null,
									case_date: caseDate || null,
									case_time: caseTime || null,
								};

								await updateCase(targetCaseId, caseData);

								// For areas, we need to handle them manually
								// Since there's no clear API, we'll keep the existing areas as-is
								// and add new ones if needed
								for (const areaName of areas) {
									if (areaName.trim()) {
										const areaData = await getAreaByName(
											areaName.trim(),
										);
										let areaId: number;
										if (areaData) {
											areaId = areaData.id;
										} else {
											areaId = await createArea({
												name: areaName.trim(),
											});
										}
										await linkCaseToArea(
											targetCaseId,
											areaId,
										);
									}
								}
							} else {
								// Create new case with areas and get case ID
								targetCaseId = await createCaseWithAreas(
									{
										case_id: caseId || null,
										case_name: normalizedCaseTitle,
										description: caseDescription || null,
										case_type: caseType || null,
										status: caseStatus || null,
										severity_level: severityLevel || null,
										notes: caseNotes || null,
										case_date: caseDate || null,
										case_time: caseTime || null,
									},
									areas,
								);
							}

							// Link all profiles to the case
							console.log(
								"Linking profiles to case. Nodes:",
								nodes.map((n) => ({
									nodeId: n.id,
									profileId: n.data.profileId,
									label: n.data.label,
								})),
							);

							for (const node of nodes) {
								const profileId = node.data.profileId;
								if (profileId && !isNaN(profileId)) {
									console.log(
										`Linking profile ${profileId} to case ${targetCaseId}`,
									);
									await assignCaseToProfile(
										targetCaseId,
										profileId,
									);
								} else {
									console.warn(
										`Node ${node.id} has invalid profileId:`,
										profileId,
									);
								}
							}

							// Extract relationships from edges
							console.log(
								"Extracting relationships from edges:",
								edges,
							);

							// Create mapping from node ID to profile ID
							const nodeToProfileMap = new Map<string, number>();
							nodes.forEach((node) => {
								if (node.data.profileId) {
									nodeToProfileMap.set(
										node.id,
										node.data.profileId,
									);
								}
							});

							console.log(
								"Node to Profile mapping:",
								Object.fromEntries(nodeToProfileMap),
							);

							const relationships: CaseRelationshipData[] = edges
								.map((edge) => {
									const sourceProfileId =
										nodeToProfileMap.get(edge.source);
									const targetProfileId =
										nodeToProfileMap.get(edge.target);
									return {
										source_profile_id: sourceProfileId || 0,
										target_profile_id: targetProfileId || 0,
										relationship_type:
											edge.data?.label || null,
									};
								})
								.filter(
									(rel) =>
										rel.source_profile_id > 0 &&
										rel.target_profile_id > 0,
								);

							console.log(
								"Extracted relationships:",
								relationships,
							);

							// Save relationships if any exist
							if (relationships.length > 0) {
								console.log(
									`Saving ${relationships.length} relationships`,
								);
								await saveCaseRelationships(
									targetCaseId,
									relationships,
								);
							}

							// Save case drugs if any exist
							const caseDrugs: CaseDrugData[] = Object.entries(
								selectedDrugs,
							)
								.filter(
									([_, quantity]) => quantity.trim() !== "",
								)
								.map(([drugIdStr, quantity]) => ({
									drug_id: Number(drugIdStr),
									quantity: quantity.trim(),
								}));

							if (caseDrugs.length > 0) {
								console.log(`Saving ${caseDrugs.length} drugs`);
								await saveCaseDrugs(targetCaseId, caseDrugs);
							}

							toast.success(
								isEditMode
									? "Case has been updated successfully!"
									: "Case has been filed successfully!",
								{
									position: "top-center",
								},
							);

							// Navigate back or to cases page
							setTimeout(() => navigate("/cases"), 1000);
						} catch (error) {
							console.error(
								isEditMode
									? "Failed to update case:"
									: "Failed to create case:",
								error,
							);
							toast.error(
								isEditMode
									? "Failed to update case. Please try again."
									: "Failed to file case. Please try again.",
								{
									position: "top-center",
								},
							);
						}
					}}
					className="space-y-4"
				>
					<Accordion
						type="single"
						collapsible
						value={activeAccordion}
						onValueChange={(value) =>
							setActiveAccordion(value || "")
						}
						className="w-full"
					>
						<AccordionItem
							value="case-details"
							className={
								activeAccordion === "case-details"
									? "border-l-4 border-blue-500 bg-blue-50/50"
									: ""
							}
						>
							<AccordionTrigger className="cursor-pointer hover:bg-gray-50 transition-colors px-2">
								<div className="flex justify-between items-center w-full mr-2">
									<div className="flex items-center gap-2">
										{completedSections.includes(
											"case-details",
										) && (
											<Check className="h-4 w-4 text-green-600" />
										)}
										<span>
											[1] Info{" "}
											<span className="text-red-500">
												*
											</span>
										</span>
										<span className="text-xs text-gray-400 ml-2">
											({caseDetailsFilledFields}/
											{caseDetailsTotalFields})
										</span>
									</div>
									<span className="text-gray-500 text-sm text-right">
										Basic information about the case
									</span>
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 px-2 ml-4">
									<div className="space-y-2">
										<Label htmlFor="case-id">Case ID</Label>
										<Input
											id="case-id"
											name="caseId"
											placeholder="Enter case ID"
											value={caseId}
											onChange={(e) =>
												setCaseId(e.target.value)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="case-type">
											Case Type
										</Label>
										<Combobox
											value={caseType}
											onValueChange={(value) =>
												setCaseType(value || "")
											}
										>
											<ComboboxInput
												placeholder="Select case type"
												showClear={!!caseType}
											/>
											<ComboboxContent>
												<ComboboxList>
													<ComboboxItem value="trafficking">
														Trafficking - Large
														scale transportation or
														movement of illegal
														drugs across regions or
														borders
													</ComboboxItem>
													<ComboboxItem value="distribution">
														Distribution - Supplying
														or selling drugs within
														a network
													</ComboboxItem>
													<ComboboxItem value="possession">
														Possession - Individual
														found holding illegal
														drugs (personal or
														commercial quantity)
													</ComboboxItem>
													<ComboboxItem value="manufacturing">
														Manufacturing -
														Production or processing
														of narcotics
													</ComboboxItem>
													<ComboboxItem value="cultivation">
														Cultivation - Growing
														illegal drug producing
														plants
													</ComboboxItem>
													<ComboboxItem value="import-export">
														Import / Export - Cross
														border smuggling of
														drugs
													</ComboboxItem>
												</ComboboxList>
											</ComboboxContent>
										</Combobox>
									</div>
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="case-title">
											Title{" "}
											<span className="text-red-500">
												*
											</span>
										</Label>
										<Input
											id="case-title"
											name="title"
											placeholder="Enter case title"
											maxLength={100}
											value={caseTitle}
											onChange={(e) =>
												setCaseTitle(e.target.value)
											}
											required
										/>
										<div className="text-sm text-gray-500">
											{caseTitle.length}/100
										</div>
									</div>
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="case-description">
											Description
										</Label>
										<Textarea
											ref={descriptionTextareaRef}
											maxLength={250}
											id="case-description"
											name="description"
											placeholder="Enter case description"
											value={caseDescription}
											onChange={(e) => {
												setCaseDescription(
													e.target.value,
												);
												handleTextareaResize(
													descriptionTextareaRef,
												);
											}}
											className="resize-none overflow-hidden"
										/>
										<div className="text-sm text-gray-500">
											{caseDescription.length}/250
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="case-date">Date</Label>
										<div className="space-y-2">
											<Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
											<Input
												id="case-date"
												name="date"
												type="date"
												value={caseDate}
												onChange={(e) =>
													setCaseDate(e.target.value)
												}
												className={`pl-8 ${caseDate ? "pr-8" : ""}`}
											/>
											{caseDate && (
												<button
													type="button"
													aria-label="Clear date"
													onClick={() =>
														setCaseDate("")
													}
													className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
												>
													<X className="h-4 w-4" />
												</button>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="case-time">Time</Label>
										<div className="relative">
											<Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
											<Input
												id="case-time"
												name="time"
												type="time"
												value={caseTime}
												onChange={(e) =>
													setCaseTime(e.target.value)
												}
												className={`pl-8 ${caseTime ? "pr-8" : ""}`}
											/>
											{caseTime && (
												<button
													type="button"
													aria-label="Clear time"
													onClick={() =>
														setCaseTime("")
													}
													className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
												>
													<X className="h-4 w-4" />
												</button>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="severity-level">
											Severity Level
										</Label>
										<Combobox
											value={severityLevel}
											onValueChange={(value) =>
												setSeverityLevel(value || "")
											}
										>
											<ComboboxInput
												placeholder="Select severity level"
												showClear={!!severityLevel}
											/>
											<ComboboxContent>
												<ComboboxList>
													<ComboboxItem value="low">
														Low
													</ComboboxItem>
													<ComboboxItem value="medium">
														Medium
													</ComboboxItem>
													<ComboboxItem value="high">
														High
													</ComboboxItem>
													<ComboboxItem value="critical">
														Critical
													</ComboboxItem>
												</ComboboxList>
											</ComboboxContent>
										</Combobox>
									</div>
									<div className="space-y-2">
										<Label htmlFor="case-status">
											Case Status
										</Label>
										<Combobox
											value={caseStatus}
											onValueChange={(value) =>
												setCaseStatus(value || "")
											}
										>
											<ComboboxInput
												placeholder="Select case status"
												showClear={!!caseStatus}
											/>
											<ComboboxContent>
												<ComboboxList>
													<ComboboxItem value="active">
														Active
													</ComboboxItem>
													<ComboboxItem value="under-surveillance">
														Under Surveillance
													</ComboboxItem>
													<ComboboxItem value="closed">
														Closed
													</ComboboxItem>
												</ComboboxList>
											</ComboboxContent>
										</Combobox>
									</div>
								</div>
							</AccordionContent>
						</AccordionItem>

						<AccordionItem
							value="connections"
							className={
								activeAccordion === "connections"
									? "border-l-4 border-blue-500 bg-blue-50/50"
									: ""
							}
						>
							<AccordionTrigger className="cursor-pointer hover:bg-gray-50 transition-colors px-2">
								<div className="flex justify-between items-center w-full mr-2">
									<div className="flex items-center gap-2">
										{completedSections.includes(
											"connections",
										) && (
											<Check className="h-4 w-4 text-green-600" />
										)}
										<span>
											[2] Network{" "}
											<span className="text-red-500">
												*
											</span>
										</span>
										<span className="text-xs text-gray-400 ml-2">
											{nodes.length}{" "}
											{nodes.length === 1
												? "profile"
												: "profiles"}
											, {edges.length}{" "}
											{edges.length === 1
												? "connection"
												: "connections"}
										</span>
									</div>
									<span className="text-gray-500 text-sm text-right">
										Add connected profiles
									</span>
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="space-y-4 pt-2 px-2 ml-4">
									<div className="flex justify-between items-center">
										<div className="space-y-1">
											<Label className="text-base">
												Connection Network
											</Label>
											<p className="text-sm text-gray-500">
												{nodes.length}{" "}
												{nodes.length === 1
													? "profile"
													: "profiles"}{" "}
												G�� {edges.length}{" "}
												{edges.length === 1
													? "connection"
													: "connections"}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="cursor-pointer"
												onClick={() => {
													setProfileSearch("");
													setIsAddProfileDialogOpen(
														true,
													);
												}}
											>
												<UserSearch className="h-4 w-4 mr-2" />
												Add Profile
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="cursor-pointer"
												onClick={() => {
													resetNewProfileForm();
													setIsNewProfileDialogOpen(
														true,
													);
												}}
											>
												<UserPlus className="h-4 w-4 mr-2" />
												New Profile
											</Button>
										</div>
									</div>
									<div className="border rounded-lg connection-canvas h-125">
										<style>{`
										.connection-canvas .react-flow__node.connectingto {
											box-shadow: 0 0 0 3px #22c55e !important;
										}
										.connection-canvas .react-flow__edge-textbg {
											fill: white;
											stroke: #6b7280;
											stroke-width: 1px;
										}
										.connection-canvas .react-flow__edge-text {
											font-weight: 500;
										}
									`}</style>
										<ReactFlow
											nodes={nodes}
											edges={edges}
											nodeTypes={nodeTypes}
											edgeTypes={edgeTypes}
											onNodesChange={onNodesChange}
											onEdgesChange={onEdgesChange}
											onConnect={onConnect}
											onEdgeClick={onEdgeClick}
											onConnectStart={onConnectStart}
											onConnectEnd={onConnectEnd}
											isValidConnection={
												isValidConnectionCheck
											}
											connectionRadius={50}
											connectionLineType={
												ConnectionLineType.Straight
											}
											connectionLineStyle={{
												stroke: isValidConnection
													? "#22c55e"
													: "#ef4444",
												strokeWidth: 2,
											}}
											defaultEdgeOptions={{
												type: "custom",
												markerEnd: {
													type: MarkerType.ArrowClosed,
													color: "#ef4444",
												},
												style: {
													strokeWidth: 2,
													stroke: "#ef4444",
												},
											}}
											defaultViewport={{
												x: 0,
												y: 0,
												zoom: 0.5,
											}}
											fitView
										>
											<Controls />
											<MiniMap />
											<Background
												variant={BackgroundVariant.Dots}
												gap={12}
												size={1}
											/>
										</ReactFlow>
									</div>

									<p className="text-sm text-gray-500">
										Click "Add Profile" to select profiles
										from the database. Drag profiles to
										reposition them, and drag from one
										profile's edge to another to create
										connections.
									</p>
								</div>
							</AccordionContent>
						</AccordionItem>

						<AccordionItem
							value="drugs"
							className={
								activeAccordion === "drugs"
									? "border-l-4 border-blue-500 bg-blue-50/50"
									: ""
							}
						>
							<AccordionTrigger className="cursor-pointer hover:bg-gray-50 transition-colors px-2">
								<div className="flex justify-between items-center w-full mr-2">
									<div className="flex items-center gap-2">
										{completedSections.includes(
											"drugs",
										) && (
											<Check className="h-4 w-4 text-green-600" />
										)}
										<span>[3] Drugs</span>
										<span className="text-xs text-gray-400 ml-2">
											{Object.keys(selectedDrugs).length}{" "}
											selected
										</span>
									</div>
									<span className="text-gray-500 text-sm text-right">
										Specify types and quantities of drugs
									</span>
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="space-y-4 pt-2 px-2">
									<div className="space-y-2 max-w-180 ml-4">
										<Label>Select Drug</Label>
										<Combobox>
											<ComboboxInput
												placeholder="Search and select a drug..."
												showTrigger
												value={drugSearch}
												onChange={(e) =>
													setDrugSearch(
														e.target.value,
													)
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
													}
												}}
											/>
											<ComboboxContent>
												<ComboboxList>
													{availableDrugs
														.filter((drug) => {
															const displayName =
																getDrugDisplayName(
																	drug,
																);
															return displayName
																.toLowerCase()
																.includes(
																	drugSearch.toLowerCase(),
																);
														})
														.map((drug) => {
															const displayName =
																getDrugDisplayName(
																	drug,
																);
															const isDrugSelected =
																drug.id in
																selectedDrugs;
															return (
																<ComboboxItem
																	key={
																		drug.id
																	}
																	value={
																		displayName
																	}
																	disabled={
																		isDrugSelected
																	}
																	onClick={() => {
																		if (
																			!isDrugSelected
																		) {
																			handleDrugSelect(
																				drug.id,
																			);
																			setDrugSearch(
																				"",
																			);
																		}
																	}}
																	className={
																		isDrugSelected
																			? "opacity-50"
																			: "cursor-pointer"
																	}
																>
																	{
																		displayName
																	}
																	{isDrugSelected
																		? " (selected)"
																		: ""}
																</ComboboxItem>
															);
														})}
												</ComboboxList>
											</ComboboxContent>
										</Combobox>
									</div>

									{Object.keys(selectedDrugs).length > 0 && (
										<div className="space-y-3 mt-4 max-w-180 ml-4">
											<Label className="text-base">
												Selected Drugs
											</Label>
											{Object.entries(selectedDrugs).map(
												([drugIdStr, quantity]) => {
													const drugId =
														Number(drugIdStr);
													const drug =
														availableDrugs.find(
															(d) =>
																d.id === drugId,
														);
													if (!drug) return null;
													const displayName =
														getDrugDisplayName(
															drug,
														);
													const hasQuantityError =
														quantity.trim() !==
															"" &&
														!isValidDrugQuantity(
															quantity.trim(),
														);
													return (
														<div
															key={drugId}
															className="flex items-center gap-3"
														>
															<div className="flex-1 flex items-center gap-3">
																<Label
																	htmlFor={`quantity-${drugId}`}
																	className="text-sm font-medium min-w-fit whitespace-nowrap"
																>
																	{
																		displayName
																	}
																	:
																</Label>
																<div className="flex-1 flex items-center gap-2">
																	<Input
																		id={`quantity-${drugId}`}
																		type="text"
																		inputMode="decimal"
																		placeholder="Enter quantity"
																		value={
																			quantity
																		}
																		onChange={(
																			e,
																		) =>
																			handleDrugQuantityChange(
																				drugId,
																				e
																					.target
																					.value,
																			)
																		}
																	/>
																</div>
															</div>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																onClick={() =>
																	handleRemoveDrug(
																		drugId,
																	)
																}
																className="cursor-pointer"
															>
																<X className="h-4 w-4" />
															</Button>
															{hasQuantityError && (
																<p className="text-xs text-red-500/70 whitespace-nowrap">
																	Quantity
																	must be a
																	number
																</p>
															)}
														</div>
													);
												},
											)}
										</div>
									)}
								</div>
							</AccordionContent>
						</AccordionItem>

						<AccordionItem
							value="areas"
							className={
								activeAccordion === "areas"
									? "border-l-4 border-blue-500 bg-blue-50/50"
									: ""
							}
						>
							<AccordionTrigger className="cursor-pointer hover:bg-gray-50 transition-colors px-2">
								<div className="flex justify-between items-center w-full mr-2">
									<div className="flex items-center gap-2">
										{completedSections.includes(
											"areas",
										) && (
											<Check className="h-4 w-4 text-green-600" />
										)}
										<span>[4] Areas</span>
										<span className="text-xs text-gray-400 ml-2">
											{areas.length} added
										</span>
									</div>
									<span className="text-gray-500 text-sm text-right">
										Locations related to the case
									</span>
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="space-y-4 pt-2 px-2">
									<div className="space-y-2 max-w-180 ml-4">
										<Label>Add Area</Label>
										<Combobox>
											<ComboboxInput
												placeholder="Enter or select area name..."
												showTrigger
												value={pendingArea}
												onChange={(e) =>
													setPendingArea(
														e.target.value,
													)
												}
												onKeyDown={(e) => {
													if (
														e.key === "Enter" ||
														e.key === "," ||
														e.key === " "
													) {
														e.preventDefault();
														if (
															pendingArea.trim()
														) {
															const newAreas =
																new Set([
																	...areas,
																	pendingArea.trim(),
																]);
															setAreas(
																Array.from(
																	newAreas,
																),
															);
															setPendingArea("");
														}
													}
												}}
											/>
											<ComboboxContent>
												<ComboboxList>
													{availableAreas
														.map((area) => ({
															area,
															...fuzzyMatch(
																pendingArea,
																area.name,
															),
														}))
														.filter(
															({ area, match }) =>
																!areas.includes(
																	area.name,
																) && match,
														)
														.sort(
															(a, b) =>
																b.score -
																a.score,
														)
														.map(({ area }) => (
															<ComboboxItem
																key={area.id}
																value={
																	area.name
																}
																onClick={() => {
																	const newAreas =
																		new Set(
																			[
																				...areas,
																				area.name,
																			],
																		);
																	setAreas(
																		Array.from(
																			newAreas,
																		),
																	);
																	setPendingArea(
																		"",
																	);
																}}
																className="cursor-pointer"
															>
																{area.name}
															</ComboboxItem>
														))}
													{pendingArea.trim() &&
														!availableAreas.some(
															(area) =>
																area.name.toLowerCase() ===
																pendingArea
																	.trim()
																	.toLowerCase(),
														) && (
															<ComboboxItem
																value={pendingArea.trim()}
																onClick={() => {
																	const newAreas =
																		new Set(
																			[
																				...areas,
																				pendingArea.trim(),
																			],
																		);
																	setAreas(
																		Array.from(
																			newAreas,
																		),
																	);
																	setPendingArea(
																		"",
																	);
																}}
																className="cursor-pointer"
															>
																Add "
																{pendingArea.trim()}
																"
															</ComboboxItem>
														)}
												</ComboboxList>
											</ComboboxContent>
										</Combobox>
										{areas.length > 0 && (
											<div className="border rounded-md min-h-10 overflow-y-auto p-2 flex gap-2 flex-wrap items-center">
												{areas.map((area, idx) => (
													<div
														key={idx}
														className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-sm font-medium text-secondary-foreground"
													>
														{area}
														<button
															type="button"
															aria-label={`Remove ${area}`}
															className="ml-2 inline-flex items-center justify-center hover:text-destructive cursor-pointer"
															onClick={() => {
																setAreas(
																	areas.filter(
																		(i) =>
																			i !==
																			area,
																	),
																);
															}}
														>
															<X className="h-3 w-3" />
														</button>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</AccordionContent>
						</AccordionItem>

						<AccordionItem
							value="notes"
							className={
								activeAccordion === "notes"
									? "border-l-4 border-blue-500 bg-blue-50/50"
									: ""
							}
						>
							<AccordionTrigger className="cursor-pointer hover:bg-gray-50 transition-colors px-2">
								<div className="flex justify-between items-center w-full mr-2">
									<div className="flex items-center gap-2">
										{completedSections.includes(
											"notes",
										) && (
											<Check className="h-4 w-4 text-green-600" />
										)}
										<span>[5] Notes</span>
										<span className="text-xs text-gray-400 ml-2">
											{caseNotes.trim().length > 0
												? "Note added"
												: "Empty"}
										</span>
									</div>
									<span className="text-gray-500 text-sm text-right">
										Additional observations and remarks
									</span>
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="space-y-2 pt-2 px-2 ml-4">
									<Label htmlFor="case-notes">Remarks</Label>
									<Textarea
										ref={textareaRef}
										maxLength={1000}
										id="case-notes"
										placeholder="Add additional notes here"
										value={caseNotes}
										onChange={(e) => {
											setCaseNotes(e.target.value);
											handleTextareaResize(textareaRef);
										}}
										className="resize-none overflow-hidden"
									/>
									<div className="text-sm text-gray-500">
										{caseNotes.length}/1000
									</div>
									<div className="pt-4 border-t mt-4 space-y-3">
										<div className="space-y-1">
											<Label className="text-sm">
												Attach Other Cases
											</Label>
											<p className="text-xs text-gray-500">
												Search existing cases from the
												database and attach them here.
											</p>
										</div>
										<div className="relative">
											<div className="flex gap-2 items-center">
												<Input
													id="attach-case-search"
													placeholder="Search cases by CNO, case ID, or title..."
													value={caseSearchQuery}
													onChange={(e) =>
														setCaseSearchQuery(
															e.target.value,
														)
													}
													className="flex-1"
												/>
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="whitespace-nowrap"
													onClick={() =>
														void runCaseSearch(
															caseSearchQuery,
														)
													}
												>
													Search
												</Button>
											</div>

											{caseSearchQuery.trim().length >= 2 && (
												<div className="rounded-md border bg-white shadow-lg">
													<div className="border-b px-3 py-2 text-xs text-gray-500">
														{isSearchingCases
															? "Searching cases..."
															: `${caseSearchResults.length} result${caseSearchResults.length === 1 ? "" : "s"}`}
													</div>
													<div className="max-h-56 overflow-y-auto">
														{!isSearchingCases && caseSearchResults.length === 0 ? (
															<div className="px-3 py-3 text-sm text-gray-500">
																No matching cases found
															</div>
														) : (
															caseSearchResults.map((caseItem) => {
																const isAlreadyAttached = attachedCases.some(
																	(attachedCase) => attachedCase.id === caseItem.id,
																);

																return (
																	<button
																		key={caseItem.id}
																		type="button"
																		disabled={isAlreadyAttached}
																		onClick={() => {
																			if (isAlreadyAttached) return;
																			setAttachedCases((current) => [...current, caseItem]);
																			setCaseSearchQuery("");
																			setCaseSearchResults([]);
																		}}
																		className={`w-full border-b px-3 py-2 text-left last:border-b-0 ${
																			isAlreadyAttached
																				? "cursor-not-allowed bg-gray-50 opacity-60"
																				: "cursor-pointer hover:bg-gray-50"
																		}`}
																	>
																		<div className="flex items-start justify-between gap-3">
																			<div className="min-w-0 flex-1">
																				<div className="flex items-center justify-between gap-3 text-xs text-gray-500">
																					<span className="font-medium text-gray-900">
																						Case ID: {caseItem.case_id || "N/A"}
																					</span>
																					<span className="shrink-0">
																						Last updated: {caseItem.updated_at || "Unknown"}
																					</span>
																				</div>
																				<div className="text-sm text-gray-700 truncate mt-1">
																					{caseItem.case_name}
																				</div>
																			</div>
																			<span className="text-xs font-medium text-blue-600">
																				{isAlreadyAttached ? "Attached" : "Attach"}
																			</span>
																		</div>
																	</button>
																);
															})
														)}
													</div>
												</div>
											)}
										</div>

										<div className="space-y-2">
											<Label className="text-xs text-gray-500">
												Attached Cases
											</Label>
											<div className="min-h-12 rounded-md border bg-white p-2">
												{attachedCases.length === 0 ? (
													<p className="text-sm text-gray-500">
														No cases attached yet
													</p>
												) : (
													<div className="space-y-2">
														{attachedCases.map(
															(caseItem) => (
																<div
																	key={
																		caseItem.id
																	}
																	className="rounded-md border bg-white px-3 py-2"
																>
																	<div className="flex items-start justify-between gap-3">
																		<div className="min-w-0 flex-1">
																			<div className="flex items-center justify-between gap-3 text-xs text-gray-500">
																				<span className="font-medium text-gray-900">
																					Case ID: {caseItem.case_id || "N/A"}
																				</span>
																				<span className="shrink-0">
																					Last updated: {caseItem.updated_at || "Unknown"}
																				</span>
																			</div>
																			<div className="text-sm text-gray-700 truncate mt-1">
																				{caseItem.case_name}
																			</div>
																		</div>
																		<button
																			type="button"
																			aria-label={`Remove ${caseItem.case_id || "case"}`}
																			onClick={() =>
																				setAttachedCases((current) =>
																					current.filter(
																						(attachedCase) =>
																							attachedCase.id !== caseItem.id,
																					),
																				)
																			}
																			className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-muted hover:text-gray-700"
																		>
																			<X className="h-4 w-4" />
																		</button>
																	</div>
																</div>
															),
														)}
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					<div className="flex justify-between pt-4">
						<AlertDialog
							open={isClearAllDialogOpen}
							onOpenChange={setIsClearAllDialogOpen}
						>
							<AlertDialogTrigger asChild>
								<Button
									type="button"
									variant="outline"
									className="cursor-pointer"
									disabled={!hasDraftData}
								>
									Clear All
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Clear all draft data?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This will remove all unsaved case
										details, network profiles, connections,
										drugs, areas, and notes from this draft.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel className="cursor-pointer">
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={clearAll}
										className="cursor-pointer"
									>
										Clear All
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<Button type="submit" className="cursor-pointer">
							{isEditMode ? "Update Case" : "Save Case"}
						</Button>
					</div>
				</form>
			)}

			{/* Dialogs moved outside of form to prevent event bubbling */}
			<Dialog
				open={isConnectionDialogOpen}
				onOpenChange={(open) => {
					setIsConnectionDialogOpen(open);
					if (!open) {
						setPendingConnection(null);
						setConnectionLabel("");
						setEditingEdgeId(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<form onSubmit={handleConnectionSubmit}>
						<DialogHeader className="px-1 pb-1">
							<DialogTitle>
								{editingEdgeId ? "Edit" : "Add"} Connection
							</DialogTitle>
							<DialogDescription>
								{editingEdgeId ? "Update the" : "Create a"}{" "}
								connection between profiles
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							{pendingConnection && (
								<div className="bg-muted p-3 rounded-md text-sm">
									<div className="flex items-center justify-between gap-2">
										<div className="flex min-w-0 items-center gap-2">
											<span
												className="font-medium truncate max-w-45"
												title={
													(nodes.find(
														(n) =>
															n.id ===
															pendingConnection.source,
													)?.data.label as string) ||
													""
												}
											>
												{
													nodes.find(
														(n) =>
															n.id ===
															pendingConnection.source,
													)?.data.label as string
												}
											</span>
											<span className="text-muted-foreground shrink-0">
												G��
											</span>
											<span
												className="font-medium truncate max-w-45"
												title={
													(nodes.find(
														(n) =>
															n.id ===
															pendingConnection.target,
													)?.data.label as string) ||
													""
												}
											>
												{
													nodes.find(
														(n) =>
															n.id ===
															pendingConnection.target,
													)?.data.label as string
												}
											</span>
										</div>
										{editingEdgeId && (
											<Trash2
												className="h-4 w-4 shrink-0 text-destructive cursor-pointer hover:text-destructive/80"
												onClick={handleConnectionDelete}
											/>
										)}
									</div>
								</div>
							)}
							<Field>
								<Label htmlFor="connection-type">
									Connection Type
								</Label>
								<Input
									id="connection-type"
									name="connectionType"
									placeholder="e.g., Supplier, Associate, Family, Known Contact"
									value={connectionLabel}
									onChange={(e) =>
										setConnectionLabel(e.target.value)
									}
									required
									autoFocus
								/>
							</Field>
						</div>
						<DialogFooter className="px-1 pt-1">
							<div className="flex w-full justify-between">
								<DialogClose asChild>
									<Button
										variant="outline"
										type="button"
										className="cursor-pointer"
									>
										Cancel
									</Button>
								</DialogClose>
								<Button
									type="submit"
									className="cursor-pointer"
								>
									{editingEdgeId ? "Update" : "Add"}{" "}
									Connection
								</Button>
							</div>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isNewProfileDialogOpen}
				onOpenChange={(open) => {
					setIsNewProfileDialogOpen(open);
					if (!open) {
						resetNewProfileForm();
					}
				}}
			>
				<DialogContent className="sm:max-w-2xl px-6">
					<form onSubmit={handleCreateNewProfile}>
						<DialogHeader>
							<DialogTitle>Create New Profile</DialogTitle>
							<DialogDescription>
								Create a profile and add it to this case network
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 my-2 py-4 px-1 max-h-[65vh] overflow-y-auto pr-1">
							<div className="grid gap-2">
								<Label htmlFor="new-profile-full-name">
									Full Name
								</Label>
								<Input
									id="new-profile-full-name"
									placeholder="John Doe"
									value={newProfileFullName}
									onChange={(e) =>
										setNewProfileFullName(e.target.value)
									}
									required
									autoFocus
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="new-profile-alias">Alias</Label>
								<Input
									id="new-profile-alias"
									placeholder="Optional"
									value={newProfileAlias}
									onChange={(e) =>
										setNewProfileAlias(e.target.value)
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="new-profile-nic">NIC</Label>
								<Input
									id="new-profile-nic"
									placeholder="Optional (must be unique)"
									value={newProfileNic}
									onChange={(e) =>
										setNewProfileNic(e.target.value)
									}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="new-profile-address-line1">
									Address Line 1
								</Label>
								<Input
									id="new-profile-address-line1"
									placeholder="Optional"
									value={newProfileAddressLine1}
									onChange={(e) =>
										setNewProfileAddressLine1(
											e.target.value,
										)
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="new-profile-address-line2">
									Address Line 2
								</Label>
								<Input
									id="new-profile-address-line2"
									placeholder="Optional"
									value={newProfileAddressLine2}
									onChange={(e) =>
										setNewProfileAddressLine2(
											e.target.value,
										)
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="new-profile-city">City</Label>
								<Input
									id="new-profile-city"
									placeholder="Optional"
									value={newProfileCity}
									onChange={(e) =>
										setNewProfileCity(e.target.value)
									}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="new-profile-notes">Notes</Label>
								<Textarea
									ref={newProfileNotesRef}
									id="new-profile-notes"
									maxLength={500}
									placeholder="Include notes"
									value={newProfileNotes}
									onChange={(e) =>
										setNewProfileNotes(e.target.value)
									}
									className="resize-none overflow-hidden"
								/>
								<div className="text-sm text-gray-500">
									{newProfileNotes.length}
									/500
								</div>
							</div>
							<div className="flex w-full justify-between gap-2 pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={resetNewProfileForm}
									className="cursor-pointer"
								>
									Clear
								</Button>
								<div className="flex gap-2">
									<DialogClose asChild>
										<Button
											type="button"
											variant="outline"
											className="cursor-pointer"
										>
											Cancel
										</Button>
									</DialogClose>
									<Button
										type="submit"
										className="cursor-pointer"
										disabled={isCreatingProfile}
									>
										{isCreatingProfile
											? "Creating..."
											: "Save Profile"}
									</Button>
								</div>
							</div>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isAddProfileDialogOpen}
				onOpenChange={(open) => {
					setIsAddProfileDialogOpen(open);
					if (!open) {
						setProfileSearch("");
					}
				}}
			>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add Profile to Case</DialogTitle>
						<DialogDescription>
							Search and select a profile from the database
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Input
							placeholder="Search by name or alias..."
							value={profileSearch}
							onChange={(e) => setProfileSearch(e.target.value)}
							autoFocus
						/>
						<div className="max-h-80 overflow-y-auto rounded-md border">
							{(() => {
								const filteredProfiles = availableProfiles
									.map((profile) => ({
										profile,
										...fuzzyMatch(
											profileSearch,
											`${profile.full_name} ${profile.alias || ""}`,
										),
									}))
									.filter(({ match }) => match)
									.sort((a, b) => b.score - a.score)
									.slice(0, 50);

								if (availableProfiles.length === 0) {
									return (
										<div className="p-4 text-center text-sm text-muted-foreground">
											No profiles found in database
										</div>
									);
								}

								if (filteredProfiles.length === 0) {
									return (
										<div className="p-4 text-center text-sm text-muted-foreground">
											No matching profiles found
										</div>
									);
								}

								return filteredProfiles.map(({ profile }) => {
									const isProfileAdded = nodes.some(
										(node) =>
											node.data?.profileId === profile.id,
									);

									return (
										<button
											key={profile.id}
											type="button"
											disabled={isProfileAdded}
											onClick={() => {
												addNode(profile);
												setIsAddProfileDialogOpen(
													false,
												);
												setProfileSearch("");
											}}
											className={`w-full border-b px-3 py-2 text-left last:border-b-0 ${
												isProfileAdded
													? "opacity-50 cursor-not-allowed bg-muted/30 hover:bg-muted/30"
													: "hover:bg-muted/50 cursor-pointer"
											}`}
										>
											<div className="flex flex-col">
												<span className="font-medium">
													{profile.full_name}
												</span>
												{profile.alias && (
													<span className="text-sm text-muted-foreground">
														Alias: {profile.alias}
													</span>
												)}
												{profile.city && (
													<span className="text-xs text-muted-foreground">
														{profile.city}
													</span>
												)}
											</div>
										</button>
									);
								});
							})()}
						</div>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button
								variant="outline"
								type="button"
								className="cursor-pointer"
							>
								Cancel
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={isRelationshipInfoDialogOpen}
				onOpenChange={(open) => {
					setIsRelationshipInfoDialogOpen(open);
					if (!open) {
						setRelationshipInfoData(null);
						setRelationshipCaseData(null);
					}
				}}
			>
				<AlertDialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
					<AlertDialogHeader>
						<AlertDialogTitle>
							Related Case Information
						</AlertDialogTitle>
					</AlertDialogHeader>
					{relationshipCaseData ? (
						<Card>
							<CardContent className="pt-2 space-y-2 pb-2">
								{/* Info Badge - Case ID, Title, Type, Severity, Status */}
								<div className="flex items-start gap-2">
									<Badge
										variant="secondary"
										className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
									>
										<FileText className="h-3 w-3" />
										Info
									</Badge>
									<div className="flex-1 space-y-1 font-semibold">
										{/* Line 1: Case ID | Name + Type/Severity/Status badges */}
										<div className="flex items-start justify-between gap-3 text-sm text-gray-700">
											<div className="min-w-0 flex items-center gap-2 flex-wrap">
												{relationshipCaseData.case_id && (
													<span>
														{
															relationshipCaseData.case_id
														}
													</span>
												)}
												{relationshipCaseData.case_id &&
													relationshipCaseData.case_name && (
														<span className="text-muted-foreground">
															|
														</span>
													)}
												{relationshipCaseData.case_name && (
													<span>
														{relationshipCaseData
															.case_name.length >
														20
															? relationshipCaseData.case_name.substring(
																	0,
																	20,
																) + "..."
															: relationshipCaseData.case_name}
													</span>
												)}
											</div>
											<div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">
												{relationshipCaseData.case_type && (
													<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{relationshipCaseData.case_type
															.split(/[\s_-]+/)
															.filter(Boolean)
															.map(
																(
																	part: string,
																) =>
																	part
																		.charAt(
																			0,
																		)
																		.toUpperCase() +
																	part
																		.slice(
																			1,
																		)
																		.toLowerCase(),
															)
															.join(" ")}
													</span>
												)}
												{relationshipCaseData.severity_level && (
													<span
														className={`px-2 py-0.5 rounded-full text-xs font-medium ${
															relationshipCaseData.severity_level ===
															"low"
																? "bg-green-100 text-green-800"
																: relationshipCaseData.severity_level ===
																	  "medium"
																	? "bg-yellow-100 text-yellow-800"
																	: relationshipCaseData.severity_level ===
																		  "high"
																		? "bg-orange-100 text-orange-800"
																		: "bg-red-100 text-red-800"
														}`}
													>
														{relationshipCaseData.severity_level
															.split(/[\s_-]+/)
															.filter(Boolean)
															.map(
																(
																	part: string,
																) =>
																	part
																		.charAt(
																			0,
																		)
																		.toUpperCase() +
																	part
																		.slice(
																			1,
																		)
																		.toLowerCase(),
															)
															.join(" ")}
													</span>
												)}
												{relationshipCaseData.status && (
													<span
														className={`px-2 py-0.5 rounded-full text-xs font-medium ${
															relationshipCaseData.status ===
															"active"
																? "bg-green-100 text-green-800"
																: relationshipCaseData.status ===
																	  "under-surveillance"
																	? "bg-yellow-100 text-yellow-800"
																	: "bg-gray-100 text-gray-800"
														}`}
													>
														{relationshipCaseData.status
															.split(/[\s_-]+/)
															.filter(Boolean)
															.map(
																(
																	part: string,
																) =>
																	part
																		.charAt(
																			0,
																		)
																		.toUpperCase() +
																	part
																		.slice(
																			1,
																		)
																		.toLowerCase(),
															)
															.join(" ")}
													</span>
												)}
											</div>
										</div>

										{/* Line 2: Date/Time | Description */}
										{(relationshipCaseData.case_date ||
											relationshipCaseData.case_time ||
											relationshipCaseData.description) && (
											<div className="flex items-center gap-2 flex-wrap text-sm text-gray-700">
												{(relationshipCaseData.case_date ||
													relationshipCaseData.case_time) && (
													<>
														{relationshipCaseData.case_date && (
															<span>
																{relationshipCaseData.case_time
																	? (() => {
																			try {
																				const dateObj =
																					new Date(
																						relationshipCaseData.case_date,
																					);
																				const [
																					hours,
																					minutes,
																				] =
																					relationshipCaseData.case_time.split(
																						":",
																					);
																				dateObj.setHours(
																					parseInt(
																						hours,
																					),
																					parseInt(
																						minutes,
																					),
																				);
																				const dateStr =
																					dateObj.toLocaleDateString(
																						"en-US",
																						{
																							month: "short",
																							day: "numeric",
																							year: "numeric",
																						},
																					);
																				const timeStr =
																					dateObj.toLocaleTimeString(
																						"en-US",
																						{
																							hour: "2-digit",
																							minute: "2-digit",
																							hour12: true,
																						},
																					);
																				return `${dateStr} @ ${timeStr}`;
																			} catch {
																				return new Date(
																					relationshipCaseData.case_date,
																				).toLocaleDateString();
																			}
																		})()
																	: new Date(
																			relationshipCaseData.case_date,
																		).toLocaleString(
																			"en-US",
																			{
																				month: "short",
																				day: "numeric",
																				year: "numeric",
																			},
																		)}
															</span>
														)}
														{!relationshipCaseData.case_date &&
															relationshipCaseData.case_time && (
																<span>
																	{
																		relationshipCaseData.case_time
																	}
																</span>
															)}
														{relationshipCaseData.description && (
															<span className="text-muted-foreground">
																|
															</span>
														)}
													</>
												)}
												{relationshipCaseData.description && (
													<span>
														{relationshipCaseData.description.replace(
															/[\r\n]+/g,
															" \\ ",
														).length > 100
															? relationshipCaseData.description
																	.replace(
																		/[\r\n]+/g,
																		" \\ ",
																	)
																	.substring(
																		0,
																		100,
																	) + "..."
															: relationshipCaseData.description.replace(
																	/[\r\n]+/g,
																	" \\ ",
																)}
													</span>
												)}
											</div>
										)}
									</div>
								</div>

								{/* Network Badge + Profiles */}
								{relationshipCaseData.profiles &&
									relationshipCaseData.profiles.length >
										0 && (
										<div className="flex items-start gap-2">
											<Badge
												variant="secondary"
												className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
											>
												<Network className="h-3 w-3" />
												Network
											</Badge>
											<div className="text-sm text-gray-700 truncate font-semibold">
												{relationshipCaseData.profiles.map(
													(p: any) => (
														<span key={p[0]}>
															{p[1].length > 20
																? p[1].substring(
																		0,
																		20,
																	) + "..."
																: p[1]}
															{relationshipCaseData.profiles.indexOf(
																p,
															) !==
																relationshipCaseData
																	.profiles
																	.length -
																	1 && ", "}
														</span>
													),
												)}
											</div>
										</div>
									)}

								{/* Drugs Badge + Details */}
								{relationshipCaseData.drugs &&
									relationshipCaseData.drugs.length > 0 && (
										<div className="flex items-start gap-2">
											<Badge
												variant="secondary"
												className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
											>
												<Pill className="h-3 w-3" />
												Drugs
											</Badge>
											<p className="text-sm text-gray-700 font-semibold">
												{relationshipCaseData.drugs.map(
													(d: any, index: number) => (
														<span
															key={`${d.drug_name}-${index}`}
														>
															{d.drug_name
																.length > 20
																? d.drug_name.substring(
																		0,
																		20,
																	) + "..."
																: d.drug_name}
															({d.quantified_by}):{" "}
															{d.quantity}
															{index !==
																relationshipCaseData
																	.drugs
																	.length -
																	1 && ", "}
														</span>
													),
												)}
											</p>
										</div>
									)}

								{/* Areas Badge + Details */}
								{relationshipCaseData.areas &&
									relationshipCaseData.areas.length > 0 && (
										<div className="flex items-start gap-2">
											<Badge
												variant="secondary"
												className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
											>
												<MapPin className="h-3 w-3" />
												Areas
											</Badge>
											<p className="text-sm text-gray-700 font-semibold">
												{relationshipCaseData.areas.map(
													(
														area: string,
														index: number,
													) => (
														<span
															key={`${area}-${index}`}
														>
															{area}
															{index !==
																relationshipCaseData
																	.areas
																	.length -
																	1 && ", "}
														</span>
													),
												)}
											</p>
										</div>
									)}

								{/* Notes Badge + Details */}
								{relationshipCaseData.notes && (
									<div className="flex items-start gap-2">
										<Badge
											variant="secondary"
											className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
										>
											<MessageSquare className="h-3 w-3" />
											Notes
										</Badge>
										<p className="text-sm text-gray-700 font-semibold">
											{relationshipCaseData.notes.replace(
												/[\r\n]+/g,
												" \\ ",
											).length > 100
												? relationshipCaseData.notes
														.replace(
															/[\r\n]+/g,
															" \\ ",
														)
														.substring(0, 100) +
													"..."
												: relationshipCaseData.notes.replace(
														/[\r\n]+/g,
														" \\ ",
													)}
										</p>
									</div>
								)}

								{/* Created At */}
								{relationshipCaseData.created_at && (
									<p className="text-xs text-gray-400 pt-1">
										Created At:{" "}
										{new Date(
											relationshipCaseData.created_at,
										).toLocaleString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
											hour12: true,
										})}
									</p>
								)}
							</CardContent>
						</Card>
					) : (
						<div className="py-8 text-center text-sm text-muted-foreground">
							Loading case information...
						</div>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel className="cursor-pointer">
							Close
						</AlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
