import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllProfiles, type ProfileWithId } from "@/lib/profiles";
import {
	getCaseAreas,
	getCaseProfiles,
	getCaseRelationships,
} from "@/lib/cases";
import { getCaseDrugs, type CaseDrugWithDetails } from "@/lib/drugs";
import {
	FolderPlus,
	Plus,
	MoreVertical,
	X,
	Check,
	Calendar,
	Clock,
	Trash2,
	ChevronLeft,
	Edit2,
	FileText,
	Pill,
	MapPin,
	Network,
	MessageSquare,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import ReactFlow, {
	MiniMap,
	Controls,
	Background,
	BackgroundVariant,
	addEdge,
	Connection,
	Edge,
	EdgeProps,
	BaseEdge,
	EdgeLabelRenderer,
	Node,
	useNodesState,
	useEdgesState,
	useReactFlow,
	MarkerType,
	Handle,
	Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

interface Profile {
	id: number;
	full_name: string;
	alias: string | null;
	nic: string | null;
	address_line1: string | null;
	address_line2: string | null;
	city: string | null;
	risk_level: string | null;
	status: string | null;
	notes: string | null;
	created_at: string | null;
	updated_at: string | null;
}

interface ProfileArea {
	id: number;
	name: string;
	is_primary: number;
}

interface ProfileRelationship {
	id: number;
	target_profile_id: number;
	target_full_name: string;
	target_alias: string | null;
	linked_case_id: number | null;
	relationship_type: string | null;
}

interface CaseWithDetails {
	id: number;
	cno: string;
	case_id: string | null;
	case_name: string;
	description?: string | null;
	case_type?: string | null;
	status?: string | null;
	severity_level?: string | null;
	notes?: string | null;
	case_date?: string | null;
	case_time?: string | null;
	created_at: string | null;
	updated_at: string | null;
	drugs?: CaseDrugWithDetails[];
	areas?: string[];
	profiles?: [number, string][];
	relationships?: {
		source_profile_id: number;
		target_profile_id: number;
		relationship_type: string | null;
	}[];
}

// Custom node component with 4 connection handles
const CustomNode = ({
	data,
	id,
}: {
	data: {
		label: string;
		fullName?: string;
		nic?: string | null;
		alias?: string | null;
		city?: string | null;
		isCurrentProfile?: boolean;
		onDelete?: (id: string) => void;
		edges?: Edge[];
	};
	id: string;
	isSelected?: boolean;
}) => {
	const bgColor = data.isCurrentProfile ? "bg-violet-600" : "bg-white";
	const textColor = data.isCurrentProfile ? "text-white" : "text-black";
	const borderColor = data.isCurrentProfile
		? "border-violet-700"
		: "border-gray-400";

	// Count connections for this node
	const connectionCount = data.edges
		? data.edges.filter((edge) => edge.source === id || edge.target === id)
				.length
		: 0;

	// Truncate name and alias to 20 characters max
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
		<div
			className={`px-4 py-2 shadow-md rounded-md ${bgColor} ${textColor} border-2 ${borderColor} relative`}
		>
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
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="font-medium text-sm cursor-help">
								{displayName}
							</div>
						</TooltipTrigger>
						<TooltipContent className="bg-slate-900 text-white p-3 rounded-md">
							<div className="text-sm space-y-1">
								{tooltipParts.map((part, idx) => (
									<div key={idx}>{part}</div>
								))}
							</div>
						</TooltipContent>
					</Tooltip>
					{!data.isCurrentProfile && data.onDelete && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<button
									onClick={(e) => {
										e.stopPropagation();
									}}
									className="hover:bg-red-100 hover:bg-opacity-20 text-current hover:text-red-600 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer p-0 flex-shrink-0"
									title="Delete profile"
								>
									<X className="w-2.5 h-2.5" />
								</button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Delete Profile
									</AlertDialogTitle>
									<AlertDialogDescription>
										<div>
											Are you sure you want to delete this
											profile?
										</div>
										{connectionCount > 0 && (
											<div className="mt-2">
												This profile has{" "}
												<span className="font-semibold">
													{connectionCount}{" "}
													{connectionCount === 1
														? "connection"
														: "connections"}
												</span>{" "}
												that will also be removed.
											</div>
										)}
										<div className="mt-2">
											This action cannot be undone.
										</div>
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel className="cursor-pointer">
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
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
				{displayAlias && (
					<div className="text-xs opacity-80 italic">
						{displayAlias}
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
	markerEnd,
}: EdgeProps) => {
	const { setEdges } = useReactFlow();
	const label = (data?.label as string) || "";
	const labelOffsetX = Number(data?.labelOffsetX ?? 0);
	const labelOffsetY = Number(data?.labelOffsetY ?? 0);
	const gradientId = `edge-gradient-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
	const midX = (sourceX + targetX) / 2;
	const midY = (sourceY + targetY) / 2;
	const controlX = midX + labelOffsetX;
	const controlY = midY + labelOffsetY;
	const edgePath = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`;
	const labelX = 0.25 * sourceX + 0.5 * controlX + 0.25 * targetX;
	const labelY = 0.25 * sourceY + 0.5 * controlY + 0.25 * targetY;

	// Truncate label if longer than 10 characters
	const displayLabel =
		label.length > 10 ? label.substring(0, 10) + "..." : label;

	const handleLabelDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();

		const startX = event.clientX;
		const startY = event.clientY;
		const initialOffsetX = labelOffsetX;
		const initialOffsetY = labelOffsetY;
		let didDrag = false;
		let nextOffsetX = initialOffsetX;
		let nextOffsetY = initialOffsetY;
		let animationFrameId: number | null = null;

		const flushDragUpdate = () => {
			animationFrameId = null;
			setEdges((edges) =>
				edges.map((edge) =>
					edge.id === id
						? {
								...edge,
								data: {
									...edge.data,
									labelOffsetX: nextOffsetX,
									labelOffsetY: nextOffsetY,
								},
							}
						: edge,
				),
			);
		};

		const handleMouseMove = (moveEvent: MouseEvent) => {
			const deltaX = moveEvent.clientX - startX;
			const deltaY = moveEvent.clientY - startY;
			if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
				didDrag = true;
			}
			nextOffsetX = initialOffsetX + deltaX;
			nextOffsetY = initialOffsetY + deltaY;

			if (animationFrameId === null) {
				animationFrameId =
					window.requestAnimationFrame(flushDragUpdate);
			}
		};

		const handleMouseUp = () => {
			if (didDrag) {
				(
					window as Window & {
						__edgeDragSuppressUntil?: number;
					}
				).__edgeDragSuppressUntil = Date.now() + 250;
			}
			if (animationFrameId !== null) {
				window.cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			flushDragUpdate();
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
	};

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
			<EdgeLabelRenderer>
				<div
					style={{
						position: "absolute",
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						pointerEvents: "all",
					}}
					className="nodrag nopan"
				>
					<div className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs select-none flex items-center gap-1">
						<div
							onMouseDown={handleLabelDragStart}
							className="cursor-move"
						>
							{displayLabel}
						</div>
						<button
							type="button"
							onClick={handleEdgeEditClick}
							className="w-4 h-4 rounded-full border border-gray-300 text-[10px] leading-none text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
							title="Edit connection"
						>
							✎
						</button>
					</div>
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

const nodeTypes = {
	custom: CustomNode,
};

const edgeTypes = {
	custom: CustomEdge,
};

export default function ProfileView() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [profileAreas, setProfileAreas] = useState<ProfileArea[]>([]);
	const [profileRelationships, setProfileRelationships] = useState<
		ProfileRelationship[]
	>([]);
	const [profileCases, setProfileCases] = useState<CaseWithDetails[]>([]);
	const [isSavingCase, setIsSavingCase] = useState(false);
	const [isDeletingProfile, setIsDeletingProfile] = useState(false);
	const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editFullName, setEditFullName] = useState("");
	const [editAlias, setEditAlias] = useState("");
	const [editNic, setEditNic] = useState("");
	const [editAddressLine1, setEditAddressLine1] = useState("");
	const [editAddressLine2, setEditAddressLine2] = useState("");
	const [editCity, setEditCity] = useState("");
	const [isEditingRightSide, setIsEditingRightSide] = useState(false);
	const [editRiskLevel, setEditRiskLevel] = useState<string | null>(null);
	const [editStatus, setEditStatus] = useState<string | null>(null);
	const [editNotes, setEditNotes] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showFileCaseForm, setShowFileCaseForm] = useState(false);
	const [caseNotes, setCaseNotes] = useState("");
	const [caseId, setCaseId] = useState("");
	const [caseTitle, setCaseTitle] = useState("");
	const [caseDescription, setCaseDescription] = useState("");
	const [severityLevel, setSeverityLevel] = useState("");
	const [caseType, setCaseType] = useState("");
	const [caseStatus, setCaseStatus] = useState("");
	const [caseDate, setCaseDate] = useState("");
	const [caseTime, setCaseTime] = useState("");
	const [casesCurrentPage, setCasesCurrentPage] = useState(1);
	const [activeAccordion, setActiveAccordion] = useState("");
	const [completedSections] = useState<string[]>([]);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
	const [selectedDrugs, setSelectedDrugs] = useState<{
		[key: string]: string;
	}>({});
	const [drugSearch, setDrugSearch] = useState("");
	const [areas, setAreas] = useState<string[]>([]);
	const [pendingArea, setPendingArea] = useState("");
	const PROFILE_CASES_PER_PAGE = 5;
	const dividerClass = "text-muted-foreground";
	const dividerText = "\u00A0\u00A0|\u00A0\u00A0";

	const formatTextWithNewlineIndicator = (text: string) => {
		return text.replace(/[\r\n]+/g, " \\ ");
	};

	const truncateName = (name: string, maxLength: number = 20) => {
		return name.length > maxLength
			? `${name.substring(0, maxLength)}...`
			: name;
	};

	const formatBadgeValue = (value: string) => {
		return value
			.split(/[\s_-]+/)
			.filter(Boolean)
			.map(
				(part) =>
					part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
			)
			.join(" ");
	};

	const getStatusColor = (status: string | null | undefined) => {
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

	const getSeverityColor = (severity: string | null | undefined) => {
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

	const enrichCasesWithMetadata = useCallback(
		async (cases: CaseWithDetails[]): Promise<CaseWithDetails[]> => {
			return await Promise.all(
				cases.map(async (caseItem) => {
					try {
						const [
							drugs,
							areasForCase,
							relationships,
							profilesForCase,
						] = await Promise.all([
							getCaseDrugs(caseItem.id),
							getCaseAreas(caseItem.id),
							getCaseRelationships(caseItem.id),
							getCaseProfiles(caseItem.id),
						]);

						return {
							...caseItem,
							drugs,
							areas: areasForCase,
							profiles: profilesForCase,
							relationships,
						};
					} catch (metadataError) {
						console.error(
							`Failed to fetch metadata for case ${caseItem.id}:`,
							metadataError,
						);
						return {
							...caseItem,
							drugs: [],
							areas: [],
							profiles: [],
							relationships: [],
						};
					}
				}),
			);
		},
		[],
	);

	const sortedProfileCases = useMemo(() => {
		return [...profileCases].sort((a, b) => {
			const bTimestamp = b.updated_at || b.created_at || "";
			const aTimestamp = a.updated_at || a.created_at || "";
			return bTimestamp.localeCompare(aTimestamp);
		});
	}, [profileCases]);

	const totalCasePages = Math.max(
		1,
		Math.ceil(sortedProfileCases.length / PROFILE_CASES_PER_PAGE),
	);

	const paginatedProfileCases = useMemo(() => {
		const start = (casesCurrentPage - 1) * PROFILE_CASES_PER_PAGE;
		return sortedProfileCases.slice(start, start + PROFILE_CASES_PER_PAGE);
	}, [sortedProfileCases, casesCurrentPage]);

	const casePageWindow = useMemo(() => {
		const pages: number[] = [];
		const start = Math.max(1, casesCurrentPage - 2);
		const end = Math.min(totalCasePages, casesCurrentPage + 2);
		for (let page = start; page <= end; page++) {
			pages.push(page);
		}
		return pages;
	}, [casesCurrentPage, totalCasePages]);

	// Aggregate drugs from all profile cases
	const aggregatedDrugs = useMemo(() => {
		const drugMap: {
			[key: string]: {
				drug_name: string;
				quantified_by: string;
				total_quantity: number;
				case_count: number;
				cases: number[];
			};
		} = {};

		profileCases.forEach((caseItem) => {
			if (caseItem.drugs && caseItem.drugs.length > 0) {
				caseItem.drugs.forEach((drug) => {
					const key = `${drug.drug_name}||${drug.quantified_by}`;
					if (!drugMap[key]) {
						drugMap[key] = {
							drug_name: drug.drug_name,
							quantified_by: drug.quantified_by,
							total_quantity: 0,
							case_count: 0,
							cases: [],
						};
					}
					// Try to parse quantity as number, default to 0 if not a number
					const qty = parseFloat(drug.quantity) || 0;
					drugMap[key].total_quantity += qty;
					if (!drugMap[key].cases.includes(caseItem.id)) {
						drugMap[key].cases.push(caseItem.id);
						drugMap[key].case_count += 1;
					}
				});
			}
		});

		return Object.values(drugMap).sort((a, b) => {
			const nameOrder = a.drug_name.localeCompare(
				b.drug_name,
				undefined,
				{
					sensitivity: "base",
				},
			);
			if (nameOrder !== 0) {
				return nameOrder;
			}
			return a.quantified_by.localeCompare(b.quantified_by, undefined, {
				sensitivity: "base",
			});
		});
	}, [profileCases]);

	const sortedConnections = useMemo(() => {
		if (!profileRelationships || profileRelationships.length === 0) {
			return [];
		}
		return [...profileRelationships].sort((a, b) => {
			return a.target_full_name.localeCompare(
				b.target_full_name,
				undefined,
				{
					sensitivity: "base",
				},
			);
		});
	}, [profileRelationships]);

	useEffect(() => {
		setCasesCurrentPage(1);
	}, [id, sortedProfileCases.length]);

	useEffect(() => {
		if (casesCurrentPage > totalCasePages) {
			setCasesCurrentPage(totalCasePages);
		}
	}, [casesCurrentPage, totalCasePages]);

	// Connection dialog state
	const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
	const [pendingConnection, setPendingConnection] = useState<
		Connection | Edge | null
	>(null);
	const [connectionLabel, setConnectionLabel] = useState("");
	const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
	const [isValidConnection, setIsValidConnection] = useState(false);

	// Add profile dialog state
	const [isAddProfileDialogOpen, setIsAddProfileDialogOpen] = useState(false);
	const [profileSearch, setProfileSearch] = useState("");
	const [availableProfiles, setAvailableProfiles] = useState<ProfileWithId[]>(
		[],
	);

	// React Flow state
	const initialNodes: Node[] = [
		{
			id: "1",
			type: "custom",
			data: {
				label: profile?.full_name || "Current Profile",
				profileId: profile?.id,
				fullName: profile?.full_name,
				nic: profile?.nic,
				alias: profile?.alias,
				city: profile?.city,
				isCurrentProfile: true,
				edges: [],
			},
			position: { x: 400, y: 200 },
		},
	];
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [nodeId, setNodeId] = useState(2);

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

		window.addEventListener(
			"open-connection-edit-dialog",
			handleOpenConnectionEditDialog,
		);

		return () => {
			window.removeEventListener(
				"open-connection-edit-dialog",
				handleOpenConnectionEditDialog,
			);
		};
	}, []);

	// List of available drugs
	const availableDrugs = [
		{ name: "Heroin", unit: "grams" },
		{ name: "Cocaine", unit: "grams" },
		{ name: "Methamphetamine", unit: "grams" },
		{ name: "Cannabis", unit: "grams" },
		{ name: "MDMA (Ecstasy)", unit: "pills" },
		{ name: "LSD", unit: "tabs" },
		{ name: "Fentanyl", unit: "grams" },
		{ name: "Amphetamine", unit: "grams" },
		{ name: "Ketamine", unit: "grams" },
		{ name: "PCP", unit: "grams" },
		{ name: "Morphine", unit: "grams" },
		{ name: "Codeine", unit: "pills" },
		{ name: "Oxycodone", unit: "pills" },
		{ name: "Hydrocodone", unit: "pills" },
		{ name: "Methadone", unit: "mg" },
	];

	const getDrugDisplayName = (name: string, unit: string) => {
		return `${name} (${unit})`;
	};

	const handleDrugSelect = (drugName: string) => {
		if (!selectedDrugs[drugName]) {
			setSelectedDrugs({ ...selectedDrugs, [drugName]: "" });
		}
		setDrugSearch("");
	};

	const handleDrugQuantityChange = (drugName: string, quantity: string) => {
		setSelectedDrugs({ ...selectedDrugs, [drugName]: quantity });
	};

	const handleRemoveDrug = (drugName: string) => {
		const updatedDrugs = { ...selectedDrugs };
		delete updatedDrugs[drugName];
		setSelectedDrugs(updatedDrugs);
	};

	// React Flow handlers
	const onConnect = useCallback(
		(params: Connection | Edge) => {
			// Prevent self-loops
			if (params.source === params.target) {
				toast.error("A profile cannot connect to itself", {
					position: "top-center",
				});
				return;
			}

			// Check if connection already exists
			const connectionExists = edges.some(
				(edge) =>
					edge.source === params.source &&
					edge.target === params.target,
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

			// Open dialog for edge label/name
			setPendingConnection(params);
			setConnectionLabel("supporter");
			setIsConnectionDialogOpen(true);
		},
		[edges],
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
				!edges.some(
					(edge) =>
						edge.source === connection.source &&
						edge.target === connection.target,
				);
			setIsValidConnection(isValid);
			return isValid;
		},
		[edges],
	);

	const handleConnectionSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (connectionLabel.trim()) {
			if (editingEdgeId) {
				// Update existing edge
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
				// Create new edge
				// Find source and target nodes to get their names
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
			// Remove the node
			setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
			// Remove any edges connected to this node
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

	const addNodeWithProfile = useCallback(
		(prof: ProfileWithId) => {
			// Check if profile is already on canvas
			const profileExists = nodes.some(
				(node) => node.data?.profileId === prof.id,
			);

			if (profileExists) {
				toast.error("Profile already added to canvas");
				return;
			}

			const displayName = prof.alias
				? `${prof.full_name} (${prof.alias})`
				: prof.full_name;

			const newNode: Node = {
				id: `${nodeId}`,
				type: "custom",
				data: {
					label: displayName,
					profileId: prof.id,
					fullName: prof.full_name,
					nic: prof.nic,
					alias: prof.alias,
					city: prof.city,
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

	const addNode = useCallback(() => {
		setIsAddProfileDialogOpen(true);
	}, []);

	// Fetch all profiles for the dialog
	useEffect(() => {
		async function fetchProfiles() {
			try {
				const allProfiles = await getAllProfiles();
				// Filter out the current profile
				const filtered = allProfiles.filter(
					(p: ProfileWithId) => p.id !== (profile?.id || null),
				);
				setAvailableProfiles(filtered);
			} catch (error) {
				console.error("Failed to fetch profiles:", error);
			}
		}
		fetchProfiles();
	}, [profile?.id]);

	// Update initial node when profile loads
	useEffect(() => {
		if (profile) {
			setNodes((nds) =>
				nds.map((node) =>
					node.id === "1"
						? {
								...node,
								data: {
									label: profile.full_name,
									profileId: profile.id,
									fullName: profile.full_name,
									alias: profile.alias,
									city: profile.city,
									isCurrentProfile: true,
									edges,
								},
							}
						: node,
				),
			);
		}
	}, [profile, setNodes, edges]);

	// Update all nodes with current edges whenever edges change
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
	}, [edges, setNodes]);

	// Auto-resize textarea based on content
	const handleTextareaResize = (
		ref: React.RefObject<HTMLTextAreaElement | null>,
	) => {
		if (ref.current) {
			ref.current.style.height = "auto";
			ref.current.style.height = `${ref.current.scrollHeight}px`;
		}
	};

	// Prevent multiple consecutive newlines in notes
	const handleNotesChange = (value: string) => {
		// Replace 3+ consecutive newlines with two newlines
		return value.replace(/\n{3,}/g, "\n\n");
	};

	useEffect(() => {
		handleTextareaResize(textareaRef);
	}, [caseNotes]);

	useEffect(() => {
		handleTextareaResize(descriptionTextareaRef);
	}, [caseDescription]);

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

	const handleSaveCase = async () => {
		if (!id) {
			toast.error("Profile ID is missing", {
				position: "top-center",
			});
			return;
		}

		if (!caseTitle.trim()) {
			toast.error("Case title is required", {
				position: "top-center",
			});
			return;
		}

		try {
			setIsSavingCase(true);
			const profileId = parseInt(id, 10);
			const newCaseId = await invoke<number>("create_case", {
				case: {
					case_id: caseId.trim() || null,
					case_name: caseTitle.trim(),
				},
			});

			await invoke("assign_case_to_profile", {
				caseId: newCaseId,
				profileId: profileId,
			});

			const updatedCases = await invoke<CaseWithDetails[]>(
				"get_profile_cases",
				{
					profileId: profileId,
				},
			);
			const enrichedCases = await enrichCasesWithMetadata(updatedCases);
			setProfileCases(enrichedCases);

			toast.success("Case has been filed successfully!", {
				position: "top-center",
			});
			setShowFileCaseForm(false);
		} catch (err) {
			console.error("Failed to save case:", err);
			toast.error("Failed to save case", {
				position: "top-center",
			});
		} finally {
			setIsSavingCase(false);
		}
	};

	const handleDeleteProfile = async () => {
		if (!id) {
			toast.error("Profile ID is missing", {
				position: "top-center",
			});
			return;
		}

		try {
			setIsDeletingProfile(true);
			const profileId = parseInt(id, 10);
			const deleted = await invoke<boolean>("delete_profile", {
				id: profileId,
			});

			if (!deleted) {
				toast.error("Profile not found", {
					position: "top-center",
				});
				return;
			}

			toast.success("Profile deleted successfully", {
				position: "top-center",
			});
			navigate("/");
		} catch (err) {
			console.error("Failed to delete profile:", err);
			toast.error("Failed to delete profile", {
				position: "top-center",
			});
		} finally {
			setIsDeletingProfile(false);
		}
	};

	const openEditProfileModal = () => {
		if (!profile) {
			return;
		}

		setEditFullName(profile.full_name ?? "");
		setEditAlias(profile.alias ?? "");
		setEditNic(profile.nic ?? "");
		setEditAddressLine1(profile.address_line1 ?? "");
		setEditAddressLine2(profile.address_line2 ?? "");
		setEditCity(profile.city ?? "");
		setIsEditDialogOpen(true);
	};

	const handleUpdateProfile = async () => {
		if (!id || !profile) {
			toast.error("Profile data is missing", {
				position: "top-center",
			});
			return;
		}

		if (!editFullName.trim()) {
			toast.error("Full name is required", {
				position: "top-center",
			});
			return;
		}

		try {
			setIsUpdatingProfile(true);
			const profileId = parseInt(id, 10);
			const updated = await invoke<boolean>("update_profile", {
				id: profileId,
				profile: {
					full_name: editFullName.trim(),
					alias: editAlias.trim() || null,
					nic: editNic.trim() || null,
					address_line1: editAddressLine1.trim() || null,
					address_line2: editAddressLine2.trim() || null,
					city: editCity.trim() || null,
					risk_level: profile.risk_level,
					status: profile.status,
					notes: profile.notes,
				},
			});

			if (!updated) {
				toast.error("Profile not found", {
					position: "top-center",
				});
				return;
			}

			const refreshedProfile = await invoke<Profile | null>(
				"get_profile",
				{
					id: profileId,
				},
			);

			if (refreshedProfile) {
				setProfile(refreshedProfile);
			}

			setIsEditDialogOpen(false);
			toast.success("Profile updated successfully", {
				position: "top-center",
			});
		} catch (err) {
			console.error("Failed to update profile:", err);
			toast.error("Failed to update profile", {
				position: "top-center",
			});
		} finally {
			setIsUpdatingProfile(false);
		}
	};

	const openEditRightSideModal = () => {
		if (!profile) {
			return;
		}
		setEditRiskLevel(profile.risk_level ?? null);
		setEditStatus(profile.status ?? null);
		setEditNotes(profile.notes ?? "");
		setIsEditingRightSide(true);
	};

	const handleSaveRightSide = async () => {
		if (!id || !profile) {
			toast.error("Profile data is missing", {
				position: "top-center",
			});
			return;
		}

		try {
			setIsUpdatingProfile(true);
			const profileId = parseInt(id, 10);
			const updated = await invoke<boolean>("update_profile", {
				id: profileId,
				profile: {
					full_name: profile.full_name,
					alias: profile.alias,
					nic: profile.nic,
					address_line1: profile.address_line1,
					address_line2: profile.address_line2,
					city: profile.city,
					risk_level: editRiskLevel,
					status: editStatus,
					notes: editNotes.trim() || null,
				},
			});

			if (!updated) {
				toast.error("Profile not found", {
					position: "top-center",
				});
				return;
			}

			const refreshedProfile = await invoke<Profile | null>(
				"get_profile",
				{
					id: profileId,
				},
			);

			if (refreshedProfile) {
				setProfile(refreshedProfile);
			}

			setIsEditingRightSide(false);
			toast.success("Profile updated successfully", {
				position: "top-center",
			});
		} catch (err) {
			console.error("Failed to update profile:", err);
			toast.error("Failed to update profile", {
				position: "top-center",
			});
		} finally {
			setIsUpdatingProfile(false);
		}
	};

	useEffect(() => {
		const fetchProfile = async () => {
			if (!id) {
				setError("No profile ID provided");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const profileId = parseInt(id, 10);

				// Fetch the main profile first
				const result = await invoke<Profile | null>("get_profile", {
					id: profileId,
				});

				if (!result) {
					setError("Profile not found");
					setProfile(null);
					setProfileAreas([]);
					setProfileRelationships([]);
					setProfileCases([]);
					setLoading(false);
					return;
				}

				// Profile exists, now fetch related data using allSettled
				// so that if some fail, we still show the profile with empty sections
				const [areasResult, relationshipsResult, casesResult] =
					await Promise.allSettled([
						invoke<ProfileArea[]>("get_profile_areas", {
							id: profileId,
						}),
						invoke<ProfileRelationship[]>(
							"get_profile_relationships",
							{
								id: profileId,
							},
						),
						invoke<CaseWithDetails[]>("get_profile_cases", {
							profileId: profileId,
						}),
					]);

				setProfile(result);
				setProfileAreas(
					areasResult.status === "fulfilled" ? areasResult.value : [],
				);
				setProfileRelationships(
					relationshipsResult.status === "fulfilled"
						? relationshipsResult.value
						: [],
				);
				if (casesResult.status === "fulfilled") {
					const enrichedCases = await enrichCasesWithMetadata(
						casesResult.value,
					);
					setProfileCases(enrichedCases);
				} else {
					setProfileCases([]);
				}
				setError(null);
			} catch (err) {
				console.error("Failed to fetch profile:", err);
				setError("Failed to load profile");
				setProfile(null);
				setProfileAreas([]);
				setProfileRelationships([]);
				setProfileCases([]);
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, [id, enrichCasesWithMetadata]);

	return (
		<>
			<div className="w-full mx-auto space-y-1">
				{loading && (
					<div className="text-center py-8">
						<p className="text-gray-500">Loading profile...</p>
					</div>
				)}

				{error && (
					<div className="text-center py-8 space-y-4">
						<p className="text-red-500 text-lg font-medium">
							{error}
						</p>
						<Button
							type="button"
							variant="outline"
							className="cursor-pointer"
							onClick={() => navigate("/")}
						>
							<ChevronLeft className="h-4 w-4 mr-2" />
							Back to All Profiles
						</Button>
					</div>
				)}

				{!loading && !error && profile && (
					<>
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold">
								{profile.full_name}
							</h2>
							<Button
								type="button"
								variant="outline"
								className="cursor-pointer"
								onClick={() => navigate("/")}
							>
								<ChevronLeft className="h-4 w-4 mr-2" />
								All Profiles
							</Button>
						</div>
						<p className="text-sm font-semibold text-gray-700">
							{profile.alias || "No alias"}
						</p>
						<div className="space-y-6">
							<Tabs
								defaultValue="overview"
								className="w-full mt-2"
							>
								<div className="flex justify-between items-center">
									<TabsList
										className={`flex gap-4 ${showFileCaseForm ? "opacity-50 pointer-events-none" : ""}`}
									>
										<TabsTrigger
											value="overview"
											className="cursor-pointer"
										>
											Profile
										</TabsTrigger>
										<TabsTrigger
											value="analytics"
											className="cursor-pointer"
										>
											Cases
										</TabsTrigger>
										<TabsTrigger
											value="reports"
											className="cursor-pointer"
										>
											Drugs
										</TabsTrigger>
										<TabsTrigger
											value="settings"
											className="cursor-pointer"
										>
											Network
										</TabsTrigger>
										<TabsTrigger
											value="areas"
											className="cursor-pointer"
										>
											Areas
										</TabsTrigger>
									</TabsList>
									<div className="flex gap-4">
										<Button
											variant="secondary"
											className="cursor-pointer"
											onClick={() =>
												navigate("/new-case", {
													state: {
														defaultProfile: profile,
													},
												})
											}
										>
											<FolderPlus className="h-4 w-4 mr-2" />
											File Case
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="secondary"
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
													onSelect={(event) => {
														event.preventDefault();
														openEditProfileModal();
													}}
												>
													Edit Profile
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													variant="destructive"
													onSelect={(event) => {
														event.preventDefault();
														setIsDeleteDialogOpen(
															true,
														);
													}}
													disabled={isDeletingProfile}
												>
													<Trash2 className="h-4 w-4" />
													Delete Profile
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
										<Dialog
											open={isEditDialogOpen}
											onOpenChange={setIsEditDialogOpen}
										>
											<DialogContent
												className="max-w-2xl"
												onOpenAutoFocus={(e) =>
													e.preventDefault()
												}
											>
												<DialogHeader>
													<DialogTitle>
														Edit Profile
													</DialogTitle>
													<DialogDescription>
														Update profile details
														and save your changes.
													</DialogDescription>
												</DialogHeader>
												<form
													onSubmit={(event) => {
														event.preventDefault();
														void handleUpdateProfile();
													}}
													className="space-y-4"
												>
													<div className="grid gap-2">
														<Label htmlFor="edit-full-name">
															Full Name
														</Label>
														<Input
															id="edit-full-name"
															value={editFullName}
															onChange={(event) =>
																setEditFullName(
																	event.target
																		.value,
																)
															}
															required
														/>
													</div>
													<div className="grid gap-2">
														<Label htmlFor="edit-nic">
															NIC
														</Label>
														<Input
															id="edit-nic"
															value={editNic}
															onChange={(event) =>
																setEditNic(
																	event.target
																		.value,
																)
															}
															placeholder="Optional (must be unique)"
														/>
													</div>
													<div className="grid gap-2">
														<Label htmlFor="edit-alias">
															Alias
														</Label>
														<Input
															id="edit-alias"
															value={editAlias}
															onChange={(event) =>
																setEditAlias(
																	event.target
																		.value,
																)
															}
															placeholder="Optional"
														/>
													</div>
													<div className="grid grid-cols-1 gap-4">
														<div className="grid gap-2">
															<Label htmlFor="edit-address-line-1">
																Address Line 1
															</Label>
															<Input
																id="edit-address-line-1"
																value={
																	editAddressLine1
																}
																onChange={(
																	event,
																) =>
																	setEditAddressLine1(
																		event
																			.target
																			.value,
																	)
																}
																placeholder="Optional"
															/>
														</div>
														<div className="grid gap-2">
															<Label htmlFor="edit-address-line-2">
																Address Line 2
															</Label>
															<Input
																id="edit-address-line-2"
																value={
																	editAddressLine2
																}
																onChange={(
																	event,
																) =>
																	setEditAddressLine2(
																		event
																			.target
																			.value,
																	)
																}
																placeholder="Optional"
															/>
														</div>
													</div>
													<div className="grid gap-2">
														<Label htmlFor="edit-city">
															City
														</Label>
														<Input
															id="edit-city"
															value={editCity}
															onChange={(event) =>
																setEditCity(
																	event.target
																		.value,
																)
															}
															placeholder="Optional"
														/>
													</div>
													<DialogFooter>
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
															disabled={
																isUpdatingProfile
															}
														>
															{isUpdatingProfile
																? "Saving..."
																: "Save Changes"}
														</Button>
													</DialogFooter>
												</form>
											</DialogContent>
										</Dialog>

										{/* Edit Right Side Modal (Risk Level, Status, Notes) */}
										<Dialog
											open={isEditingRightSide}
											onOpenChange={setIsEditingRightSide}
										>
											<DialogContent className="max-w-md max-h-[90vh] flex flex-col">
												<DialogHeader>
													<DialogTitle>
														Additional Details
													</DialogTitle>
												</DialogHeader>
												<form
													onSubmit={(e) => {
														e.preventDefault();
														void handleSaveRightSide();
													}}
													className="flex flex-col flex-1 overflow-hidden"
												>
													<div className="overflow-y-auto flex-1 space-y-4 pr-2">
														<div className="mt-4">
															<Label className="text-base font-semibold mb-4 block">
																Risk Level
															</Label>
															<div className="flex gap-3 px-2">
																{[
																	"Low",
																	"Medium",
																	"High",
																].map(
																	(level) => (
																		<button
																			key={
																				level
																			}
																			type="button"
																			onClick={() =>
																				setEditRiskLevel(
																					editRiskLevel ===
																						level
																						? null
																						: level,
																				)
																			}
																			className="flex items-center gap-2 relative"
																		>
																			<Badge
																				variant={
																					editRiskLevel ===
																					level
																						? level ===
																							"Low"
																							? "secondary"
																							: level ===
																								  "Medium"
																								? "default"
																								: "destructive"
																						: "outline"
																				}
																				className={`px-3 py-1 cursor-pointer transition-all ${
																					editRiskLevel ===
																						level &&
																					level ===
																						"High"
																						? "text-white"
																						: ""
																				}`}
																			>
																				{
																					level
																				}
																			</Badge>
																			{editRiskLevel ===
																				level && (
																				<Check className="absolute -top-1 -right-1 h-4 w-4 bg-white rounded-full" />
																			)}
																		</button>
																	),
																)}
															</div>
														</div>

														<div className="mt-4">
															<Label className="text-base font-semibold mb-4 block">
																Status
															</Label>
															<FieldGroup className="flex flex-row gap-2 px-2">
																{[
																	"Active",
																	"Inactive",
																	"Suspended",
																].map(
																	(
																		statusOption,
																	) => (
																		<Field
																			key={
																				statusOption
																			}
																			orientation="horizontal"
																		>
																			<Checkbox
																				id={`right-status-${statusOption}`}
																				name={`right-status-${statusOption}`}
																				checked={
																					editStatus ===
																					statusOption
																				}
																				onCheckedChange={(
																					checked,
																				) => {
																					if (
																						checked
																					) {
																						setEditStatus(
																							statusOption,
																						);
																					} else if (
																						editStatus ===
																						statusOption
																					) {
																						setEditStatus(
																							null,
																						);
																					}
																				}}
																			/>
																			<FieldLabel
																				htmlFor={`right-status-${statusOption}`}
																				className="cursor-pointer"
																			>
																				{
																					statusOption
																				}
																			</FieldLabel>
																		</Field>
																	),
																)}
															</FieldGroup>
														</div>

														<div className="grid gap-2">
															<Label htmlFor="right-notes">
																Notes
															</Label>
															<div className="px-2">
																<Textarea
																	id="right-notes"
																	maxLength={
																		500
																	}
																	value={
																		editNotes
																	}
																	onChange={(
																		event,
																	) =>
																		setEditNotes(
																			handleNotesChange(
																				event
																					.target
																					.value,
																			),
																		)
																	}
																	placeholder="Add notes"
																	className="resize-none"
																/>
																<div className="text-sm text-gray-500">
																	{
																		editNotes.length
																	}
																	/500
																</div>
															</div>
														</div>
													</div>

													<DialogFooter className="mt-4">
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
															disabled={
																isUpdatingProfile
															}
														>
															{isUpdatingProfile
																? "Saving..."
																: "Save Changes"}
														</Button>
													</DialogFooter>
												</form>
											</DialogContent>
										</Dialog>

										<AlertDialog
											open={isDeleteDialogOpen}
											onOpenChange={setIsDeleteDialogOpen}
										>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Delete Profile
													</AlertDialogTitle>
													<AlertDialogDescription>
														Are you sure you want to
														delete this profile?
														This action cannot be
														undone.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel className="cursor-pointer">
														Cancel
													</AlertDialogCancel>
													<AlertDialogAction
														className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
														onClick={() => {
															setIsDeleteDialogOpen(
																false,
															);
															void handleDeleteProfile();
														}}
														disabled={
															isDeletingProfile
														}
													>
														{isDeletingProfile
															? "Deleting..."
															: "Delete"}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</div>
								<Separator className="my-4" />
								{showFileCaseForm ? (
									<div className="space-y-1">
										<h2 className="text-xl font-semibold">
											File New Case
										</h2>
										<p className="text-sm text-gray-500">
											Complete the following steps to file
											a new case for this profile.
										</p>
										<form
											onSubmit={(e) => {
												e.preventDefault();
												void handleSaveCase();
											}}
											className="space-y-4"
										>
											<Accordion
												type="single"
												collapsible
												value={activeAccordion}
												onValueChange={(value) =>
													setActiveAccordion(
														value || "",
													)
												}
												className="w-full"
											>
												<AccordionItem
													value="case-details"
													className={
														activeAccordion ===
														"case-details"
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
																	[1] Case
																	Details
																</span>
																<span className="text-xs text-gray-400 ml-2">
																	(
																	{
																		caseDetailsFilledFields
																	}
																	/
																	{
																		caseDetailsTotalFields
																	}
																	)
																</span>
															</div>
															<span className="text-gray-500 text-sm text-right">
																Basic
																information
																about the case
															</span>
														</div>
													</AccordionTrigger>
													<AccordionContent>
														<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 px-2 ml-4">
															<div className="space-y-2">
																<Label htmlFor="case-id">
																	Case ID *
																</Label>
																<Input
																	id="case-id"
																	name="caseId"
																	placeholder="Enter case ID"
																	value={
																		caseId
																	}
																	onChange={(
																		e,
																	) =>
																		setCaseId(
																			e
																				.target
																				.value,
																		)
																	}
																	required
																/>
															</div>
															<div className="space-y-2">
																<Label htmlFor="case-type">
																	Case Type *
																</Label>
																<Combobox
																	value={
																		caseType
																	}
																	onValueChange={(
																		value,
																	) =>
																		setCaseType(
																			value ||
																				"",
																		)
																	}
																>
																	<ComboboxInput
																		placeholder="Select case type"
																		showClear={
																			!!caseType
																		}
																	/>
																	<ComboboxContent>
																		<ComboboxList>
																			<ComboboxItem value="trafficking">
																				Trafficking
																				-
																				Large
																				scale
																				transportation
																				or
																				movement
																				of
																				illegal
																				drugs
																				across
																				regions
																				or
																				borders
																			</ComboboxItem>
																			<ComboboxItem value="distribution">
																				Distribution
																				-
																				Supplying
																				or
																				selling
																				drugs
																				within
																				a
																				network
																			</ComboboxItem>
																			<ComboboxItem value="possession">
																				Possession
																				-
																				Individual
																				found
																				holding
																				illegal
																				drugs
																				(personal
																				or
																				commercial
																				quantity)
																			</ComboboxItem>
																			<ComboboxItem value="manufacturing">
																				Manufacturing
																				-
																				Production
																				or
																				processing
																				of
																				narcotics
																			</ComboboxItem>
																			<ComboboxItem value="cultivation">
																				Cultivation
																				-
																				Growing
																				illegal
																				drug
																				producing
																				plants
																			</ComboboxItem>
																			<ComboboxItem value="import-export">
																				Import
																				/
																				Export
																				-
																				Cross
																				border
																				smuggling
																				of
																				drugs
																			</ComboboxItem>
																		</ComboboxList>
																	</ComboboxContent>
																</Combobox>
															</div>
															<div className="space-y-2 md:col-span-2">
																<Label htmlFor="case-title">
																	Title *
																</Label>
																<Input
																	id="case-title"
																	name="title"
																	placeholder="Enter case title"
																	maxLength={
																		100
																	}
																	value={
																		caseTitle
																	}
																	onChange={(
																		e,
																	) =>
																		setCaseTitle(
																			e
																				.target
																				.value,
																		)
																	}
																	required
																/>
																<div className="text-sm text-gray-500">
																	{
																		caseTitle.length
																	}
																	/100
																</div>
															</div>
															<div className="space-y-2 md:col-span-2">
																<Label htmlFor="case-description">
																	Description
																</Label>
																<Textarea
																	ref={
																		descriptionTextareaRef
																	}
																	maxLength={
																		250
																	}
																	id="case-description"
																	name="description"
																	placeholder="Enter case description"
																	value={
																		caseDescription
																	}
																	onChange={(
																		e,
																	) => {
																		setCaseDescription(
																			e
																				.target
																				.value,
																		);
																		handleTextareaResize(
																			descriptionTextareaRef,
																		);
																	}}
																	className="resize-none overflow-hidden"
																/>
																<div className="text-sm text-gray-500">
																	{
																		caseDescription.length
																	}
																	/250
																</div>
															</div>
															<div className="space-y-2">
																<Label htmlFor="case-date">
																	Date *
																</Label>
																<div className="relative">
																	<Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
																	<Input
																		id="case-date"
																		name="date"
																		type="date"
																		value={
																			caseDate
																		}
																		onChange={(
																			e,
																		) =>
																			setCaseDate(
																				e
																					.target
																					.value,
																			)
																		}
																		required
																		className={`pl-8 ${caseDate ? "pr-8" : ""}`}
																	/>
																	{caseDate && (
																		<button
																			type="button"
																			aria-label="Clear date"
																			onClick={() =>
																				setCaseDate(
																					"",
																				)
																			}
																			className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
																		>
																			<X className="h-4 w-4" />
																		</button>
																	)}
																</div>
															</div>
															<div className="space-y-2">
																<Label htmlFor="case-time">
																	Time *
																</Label>
																<div className="relative">
																	<Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
																	<Input
																		id="case-time"
																		name="time"
																		type="time"
																		value={
																			caseTime
																		}
																		onChange={(
																			e,
																		) =>
																			setCaseTime(
																				e
																					.target
																					.value,
																			)
																		}
																		required
																		className={`pl-8 ${caseTime ? "pr-8" : ""}`}
																	/>
																	{caseTime && (
																		<button
																			type="button"
																			aria-label="Clear time"
																			onClick={() =>
																				setCaseTime(
																					"",
																				)
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
																	Severity
																	Level *
																</Label>
																<Combobox
																	value={
																		severityLevel
																	}
																	onValueChange={(
																		value,
																	) =>
																		setSeverityLevel(
																			value ||
																				"",
																		)
																	}
																>
																	<ComboboxInput
																		placeholder="Select severity level"
																		showClear={
																			!!severityLevel
																		}
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
																	*
																</Label>
																<Combobox
																	value={
																		caseStatus
																	}
																	onValueChange={(
																		value,
																	) =>
																		setCaseStatus(
																			value ||
																				"",
																		)
																	}
																>
																	<ComboboxInput
																		placeholder="Select case status"
																		showClear={
																			!!caseStatus
																		}
																	/>
																	<ComboboxContent>
																		<ComboboxList>
																			<ComboboxItem value="active">
																				Active
																			</ComboboxItem>
																			<ComboboxItem value="under-surveillance">
																				Under
																				Surveillance
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
														activeAccordion ===
														"connections"
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
																	[2]
																	Connections
																</span>
																<span className="text-xs text-gray-400 ml-2">
																	{
																		nodes.length
																	}{" "}
																	{nodes.length ===
																	1
																		? "profile"
																		: "profiles"}
																	,{" "}
																	{
																		edges.length
																	}{" "}
																	{edges.length ===
																	1
																		? "connection"
																		: "connections"}
																</span>
															</div>
															<span className="text-gray-500 text-sm text-right">
																Add connected
																profiles
															</span>
														</div>
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-4 pt-2 px-2 ml-4">
															<div className="flex justify-between items-center">
																<div className="space-y-1">
																	<Label className="text-base">
																		Connection
																		Network
																	</Label>
																	<p className="text-sm text-gray-500">
																		{
																			nodes.length
																		}{" "}
																		{nodes.length ===
																		1
																			? "profile"
																			: "profiles"}{" "}
																		•{" "}
																		{
																			edges.length
																		}{" "}
																		{edges.length ===
																		1
																			? "connection"
																			: "connections"}
																	</p>
																</div>
																<Button
																	type="button"
																	variant="outline"
																	size="sm"
																	className="cursor-pointer"
																	onClick={
																		addNode
																	}
																>
																	<Plus className="h-4 w-4 mr-2" />
																	Add Profile
																</Button>
															</div>
															<div className="border rounded-lg connection-canvas h-125">
																<style>{`
																	/* Green glow on valid target nodes during connection */
																	.connection-canvas .react-flow__node.connectingto {
																		box-shadow: 0 0 0 3px #22c55e !important;
																	}
																	/* Edge label background with border */
																	.connection-canvas .react-flow__edge-textbg {
																		fill: white;
																		stroke: #6b7280;
																		stroke-width: 1px;
																	}
																	/* Edge label text styling */
																	.connection-canvas .react-flow__edge-text {
																		font-weight: 500;
																	}
																`}</style>
																<ReactFlow
																	nodes={
																		nodes
																	}
																	edges={
																		edges
																	}
																	nodeTypes={
																		nodeTypes
																	}
																	edgeTypes={
																		edgeTypes
																	}
																	onNodesChange={
																		onNodesChange
																	}
																	onEdgesChange={
																		onEdgesChange
																	}
																	onConnect={
																		onConnect
																	}
																	onEdgeClick={
																		onEdgeClick
																	}
																	onConnectStart={
																		onConnectStart
																	}
																	onConnectEnd={
																		onConnectEnd
																	}
																	isValidConnection={
																		isValidConnectionCheck
																	}
																	connectionRadius={
																		50
																	}
																	connectionLineStyle={{
																		stroke: isValidConnection
																			? "#22c55e"
																			: "#ef4444",
																		strokeWidth: 2,
																	}}
																	defaultEdgeOptions={{
																		type: "custom",
																		markerEnd:
																			{
																				type: MarkerType.ArrowClosed,
																			},
																		style: {
																			strokeWidth: 2,
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
																		variant={
																			BackgroundVariant.Dots
																		}
																		gap={12}
																		size={1}
																	/>
																</ReactFlow>
															</div>

															{/* Connection Dialog */}
															<Dialog
																open={
																	isConnectionDialogOpen
																}
																onOpenChange={(
																	open,
																) => {
																	setIsConnectionDialogOpen(
																		open,
																	);
																	if (!open) {
																		setPendingConnection(
																			null,
																		);
																		setConnectionLabel(
																			"",
																		);
																		setEditingEdgeId(
																			null,
																		);
																	}
																}}
															>
																<DialogContent className="sm:max-w-md">
																	<form
																		onSubmit={
																			handleConnectionSubmit
																		}
																	>
																		<DialogHeader>
																			<DialogTitle>
																				{editingEdgeId
																					? "Edit"
																					: "Add"}{" "}
																				Connection
																			</DialogTitle>
																			<DialogDescription>
																				{editingEdgeId
																					? "Update the"
																					: "Create a"}{" "}
																				connection
																				between
																				profiles
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
																										(
																											n,
																										) =>
																											n.id ===
																											pendingConnection.source,
																									)
																										?.data
																										.label as string) ||
																									""
																								}
																							>
																								{
																									nodes.find(
																										(
																											n,
																										) =>
																											n.id ===
																											pendingConnection.source,
																									)
																										?.data
																										.label
																								}
																							</span>
																							<span className="text-muted-foreground shrink-0">
																								→
																							</span>
																							<span
																								className="font-medium truncate max-w-45"
																								title={
																									(nodes.find(
																										(
																											n,
																										) =>
																											n.id ===
																											pendingConnection.target,
																									)
																										?.data
																										.label as string) ||
																									""
																								}
																							>
																								{
																									nodes.find(
																										(
																											n,
																										) =>
																											n.id ===
																											pendingConnection.target,
																									)
																										?.data
																										.label
																								}
																							</span>
																						</div>
																						{editingEdgeId && (
																							<Trash2
																								className="h-4 w-4 shrink-0 text-destructive cursor-pointer hover:text-destructive/80"
																								onClick={
																									handleConnectionDelete
																								}
																							/>
																						)}
																					</div>
																				</div>
																			)}
																			<Field>
																				<Label htmlFor="connection-type">
																					Connection
																					Type
																				</Label>
																				<Input
																					id="connection-type"
																					name="connectionType"
																					placeholder="e.g., Supplier, Associate, Family, Known Contact"
																					value={
																						connectionLabel
																					}
																					onChange={(
																						e,
																					) =>
																						setConnectionLabel(
																							e
																								.target
																								.value,
																						)
																					}
																					required
																					autoFocus
																				/>
																			</Field>
																		</div>
																		<DialogFooter>
																			<div className="flex w-full justify-between">
																				<DialogClose
																					asChild
																				>
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
																					{editingEdgeId
																						? "Update"
																						: "Add"}{" "}
																					Connection
																				</Button>
																			</div>
																		</DialogFooter>
																	</form>
																</DialogContent>
															</Dialog>

															{/* Add Profile Dialog */}
															<Dialog
																open={
																	isAddProfileDialogOpen
																}
																onOpenChange={
																	setIsAddProfileDialogOpen
																}
															>
																<DialogContent className="sm:max-w-md">
																	<DialogHeader>
																		<DialogTitle>
																			Add
																			Profile
																			to
																			Network
																		</DialogTitle>
																		<DialogDescription>
																			Search
																			and
																			select
																			a
																			profile
																			to
																			add
																		</DialogDescription>
																	</DialogHeader>
																	<div className="space-y-4 py-4">
																		<Input
																			type="text"
																			placeholder="Search profiles..."
																			value={
																				profileSearch
																			}
																			onChange={(
																				e,
																			) =>
																				setProfileSearch(
																					e
																						.target
																						.value,
																				)
																			}
																			className="w-full"
																		/>
																		<div className="border rounded-md max-h-60 overflow-y-auto">
																			{(() => {
																				const filteredProfiles =
																					availableProfiles.filter(
																						({
																							full_name,
																							alias,
																						}) => {
																							const searchLower =
																								profileSearch.toLowerCase();
																							return (
																								full_name
																									.toLowerCase()
																									.includes(
																										searchLower,
																									) ||
																								(alias &&
																									alias
																										.toLowerCase()
																										.includes(
																											searchLower,
																										))
																							);
																						},
																					);

																				if (
																					filteredProfiles.length ===
																					0
																				) {
																					return (
																						<div className="p-4 text-center text-sm text-muted-foreground">
																							No
																							matching
																							profiles
																							found
																						</div>
																					);
																				}

																				return filteredProfiles.map(
																					(
																						prof,
																					) => {
																						const isProfileAdded =
																							nodes.some(
																								(
																									node,
																								) =>
																									node
																										.data
																										?.profileId ===
																									prof.id,
																							);

																						return (
																							<button
																								key={
																									prof.id
																								}
																								type="button"
																								disabled={
																									isProfileAdded
																								}
																								onClick={() => {
																									addNodeWithProfile(
																										prof,
																									);
																									setIsAddProfileDialogOpen(
																										false,
																									);
																									setProfileSearch(
																										"",
																									);
																								}}
																								className={`w-full border-b px-3 py-2 text-left last:border-b-0 ${
																									isProfileAdded
																										? "opacity-50 cursor-not-allowed bg-muted/30 hover:bg-muted/30"
																										: "hover:bg-muted/50 cursor-pointer"
																								}`}
																							>
																								<div className="flex flex-col">
																									<span className="font-medium">
																										{
																											prof.full_name
																										}
																									</span>
																									{prof.alias && (
																										<span className="text-sm text-muted-foreground">
																											Alias:{" "}
																											{
																												prof.alias
																											}
																										</span>
																									)}
																									{prof.city && (
																										<span className="text-xs text-muted-foreground">
																											{
																												prof.city
																											}
																										</span>
																									)}
																								</div>
																							</button>
																						);
																					},
																				);
																			})()}
																		</div>
																	</div>
																	<DialogFooter>
																		<DialogClose
																			asChild
																		>
																			<Button
																				type="button"
																				variant="outline"
																				className="cursor-pointer"
																			>
																				Close
																			</Button>
																		</DialogClose>
																	</DialogFooter>
																</DialogContent>
															</Dialog>

															<p className="text-sm text-gray-500">
																Click "Add
																Profile" to
																create new
																profiles. Drag
																profiles to
																reposition them,
																and drag from
																one profile's
																edge to another
																to create
																connections.
															</p>
														</div>
													</AccordionContent>
												</AccordionItem>
												<AccordionItem
													value="drugs"
													className={
														activeAccordion ===
														"drugs"
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
																<span>
																	[3] Drugs
																</span>
																<span className="text-xs text-gray-400 ml-2">
																	{
																		Object.keys(
																			selectedDrugs,
																		).length
																	}{" "}
																	selected
																</span>
															</div>
															<span className="text-gray-500 text-sm text-right">
																Specify types
																and quantities
																of drugs
															</span>
														</div>
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-4 pt-2 px-2">
															<div className="space-y-2 max-w-180 ml-4">
																<Label>
																	Select Drug
																</Label>
																<Combobox>
																	<ComboboxInput
																		placeholder="Search and select a drug..."
																		showTrigger
																		value={
																			drugSearch
																		}
																		onChange={(
																			e,
																		) =>
																			setDrugSearch(
																				e
																					.target
																					.value,
																			)
																		}
																	/>
																	<ComboboxContent>
																		<ComboboxList>
																			{availableDrugs
																				.filter(
																					(
																						drug,
																					) => {
																						const displayName =
																							getDrugDisplayName(
																								drug.name,
																								drug.unit,
																							);
																						return (
																							!(
																								displayName in
																								selectedDrugs
																							) &&
																							displayName
																								.toLowerCase()
																								.includes(
																									drugSearch.toLowerCase(),
																								)
																						);
																					},
																				)
																				.map(
																					(
																						drug,
																					) => {
																						const displayName =
																							getDrugDisplayName(
																								drug.name,
																								drug.unit,
																							);
																						return (
																							<ComboboxItem
																								key={
																									displayName
																								}
																								value={
																									displayName
																								}
																								onClick={() => {
																									handleDrugSelect(
																										displayName,
																									);
																									setDrugSearch(
																										"",
																									);
																								}}
																								className="cursor-pointer"
																							>
																								{
																									displayName
																								}
																							</ComboboxItem>
																						);
																					},
																				)}
																		</ComboboxList>
																	</ComboboxContent>
																</Combobox>
															</div>

															{/* Selected Drugs List */}
															{Object.keys(
																selectedDrugs,
															).length > 0 && (
																<div className="space-y-3 mt-4 max-w-180 ml-4">
																	<Label className="text-base">
																		Selected
																		Drugs
																	</Label>
																	{Object.entries(
																		selectedDrugs,
																	).map(
																		([
																			drugName,
																			quantity,
																		]) => (
																			<div
																				key={
																					drugName
																				}
																				className="flex items-center gap-3"
																			>
																				<div className="flex-1 flex items-center gap-3">
																					<Label
																						htmlFor={`quantity-${drugName}`}
																						className="text-sm font-medium min-w-fit whitespace-nowrap"
																					>
																						{
																							drugName
																						}

																						:
																					</Label>
																					<Input
																						id={`quantity-${drugName}`}
																						type="text"
																						placeholder="Enter quantity"
																						value={
																							quantity
																						}
																						onChange={(
																							e,
																						) =>
																							handleDrugQuantityChange(
																								drugName,
																								e
																									.target
																									.value,
																							)
																						}
																						className="flex-1"
																					/>
																				</div>
																				<Button
																					type="button"
																					variant="ghost"
																					size="icon"
																					onClick={() =>
																						handleRemoveDrug(
																							drugName,
																						)
																					}
																					className="cursor-pointer"
																				>
																					<X className="h-4 w-4" />
																				</Button>
																			</div>
																		),
																	)}
																</div>
															)}
														</div>
													</AccordionContent>
												</AccordionItem>
												<AccordionItem
													value="areas"
													className={
														activeAccordion ===
														"areas"
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
																<span>
																	[4] Areas
																</span>
																<span className="text-xs text-gray-400 ml-2">
																	{
																		areas.length
																	}{" "}
																	added
																</span>
															</div>
															<span className="text-gray-500 text-sm text-right">
																Locations
																related to the
																case
															</span>
														</div>
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-4 pt-2 px-2">
															<div className="space-y-2 max-w-180 ml-4">
																<Label>
																	Add Area
																</Label>
																<Field orientation="horizontal">
																	<Input
																		value={
																			pendingArea
																		}
																		onChange={(
																			e,
																		) =>
																			setPendingArea(
																				e
																					.target
																					.value,
																			)
																		}
																		onKeyDown={(
																			e,
																		) => {
																			if (
																				e.key ===
																				"Enter"
																			) {
																				e.preventDefault();
																				if (
																					pendingArea.trim()
																				) {
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
																				}
																			} else if (
																				e.key ===
																					"," ||
																				e.key ===
																					" "
																			) {
																				e.preventDefault();
																				if (
																					pendingArea.trim()
																				) {
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
																				}
																			}
																		}}
																		placeholder="Enter area name (press Enter, comma, or space to add)"
																	/>
																	<Button
																		type="button"
																		variant="outline"
																		className="cursor-pointer"
																		onClick={() => {
																			if (
																				pendingArea.trim()
																			) {
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
																			}
																		}}
																	>
																		Add
																	</Button>
																</Field>
																{areas.length >
																	0 && (
																	<div className="border rounded-md min-h-10 overflow-y-auto p-2 flex gap-2 flex-wrap items-center">
																		{areas.map(
																			(
																				area,
																				idx,
																			) => (
																				<div
																					key={
																						idx
																					}
																					className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-sm font-medium text-secondary-foreground"
																				>
																					{
																						area
																					}
																					<button
																						type="button"
																						aria-label={`Remove ${area}`}
																						className="ml-2 inline-flex items-center justify-center hover:text-destructive cursor-pointer"
																						onClick={() => {
																							setAreas(
																								areas.filter(
																									(
																										i,
																									) =>
																										i !==
																										area,
																								),
																							);
																						}}
																					>
																						<X className="h-3 w-3" />
																					</button>
																				</div>
																			),
																		)}
																	</div>
																)}
															</div>
														</div>
													</AccordionContent>
												</AccordionItem>
												<AccordionItem
													value="notes"
													className={
														activeAccordion ===
														"notes"
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
																<span>
																	[5] Notes
																</span>
																<span className="text-xs text-gray-400 ml-2">
																	{caseNotes.trim()
																		.length >
																	0
																		? "Note added"
																		: "Empty"}
																</span>
															</div>
															<span className="text-gray-500 text-sm text-right">
																Additional
																observations and
																remarks
															</span>
														</div>
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-2 pt-2 px-2 ml-4">
															<Label htmlFor="case-notes">
																Remarks
															</Label>
															<Textarea
																ref={
																	textareaRef
																}
																maxLength={1000}
																id="case-notes"
																placeholder="Add additional notes here"
																value={
																	caseNotes
																}
																onChange={(
																	e,
																) => {
																	setCaseNotes(
																		e.target
																			.value,
																	);
																	handleTextareaResize(
																		textareaRef,
																	);
																}}
																className="resize-none overflow-hidden"
															/>
															<div className="text-sm text-gray-500">
																{
																	caseNotes.length
																}
																/1000
															</div>
														</div>
													</AccordionContent>
												</AccordionItem>
											</Accordion>
											<div className="flex justify-between pt-4">
												<Button
													type="button"
													variant="outline"
													className="cursor-pointer"
													onClick={() =>
														setShowFileCaseForm(
															false,
														)
													}
												>
													Clear All
												</Button>
												<div className="flex gap-4">
													<Button
														type="button"
														variant="outline"
														className="cursor-pointer"
														onClick={() => {
															console.log(
																"Save draft",
															);
														}}
													>
														Save Draft
													</Button>
													<Button
														type="submit"
														className="cursor-pointer"
														disabled={isSavingCase}
													>
														{isSavingCase
															? "Saving..."
															: "Save Case"}
													</Button>
												</div>
											</div>
										</form>
									</div>
								) : (
									<>
										<TabsContent value="overview">
											<div className="space-y-6">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
													{/* Left Column: Full Name, Alias, NIC, Address Fields */}
													<div className="space-y-4">
														<div className="space-y-1">
															<Label className="text-xs text-gray-500">
																Full Name
															</Label>
															<p className="text-base font-medium text-gray-900">
																{
																	profile.full_name
																}
															</p>
														</div>

														{profile.alias && (
															<div className="space-y-1">
																<Label className="text-xs text-gray-500">
																	Alias
																</Label>
																<p className="text-base font-medium text-gray-900">
																	{
																		profile.alias
																	}
																</p>
															</div>
														)}

														{profile.nic && (
															<div className="space-y-1">
																<Label className="text-xs text-gray-500">
																	NIC
																</Label>
																<p className="text-base font-medium text-gray-900">
																	{
																		profile.nic
																	}
																</p>
															</div>
														)}

														<div className="mt-6">
															{profile.address_line1 && (
																<div className="space-y-1 mb-3">
																	<Label className="text-xs text-gray-500">
																		Address
																		Line 1
																	</Label>
																	<p className="text-base font-medium text-gray-900">
																		{
																			profile.address_line1
																		}
																	</p>
																</div>
															)}

															{profile.address_line2 && (
																<div className="space-y-1 mb-3">
																	<Label className="text-xs text-gray-500">
																		Address
																		Line 2
																	</Label>
																	<p className="text-base font-medium text-gray-900">
																		{
																			profile.address_line2
																		}
																	</p>
																</div>
															)}

															{profile.city && (
																<div className="space-y-1">
																	<Label className="text-xs text-gray-500">
																		City
																	</Label>
																	<p className="text-base font-medium text-gray-900">
																		{
																			profile.city
																		}
																	</p>
																</div>
															)}
														</div>
													</div>

													{/* Right Column: Risk Level, Status, Notes with Edit Button */}
													<div className="space-y-4">
														<div className="flex items-center justify-between mb-4">
															<h4 className="text-sm font-semibold text-gray-700">
																Additional
																Details
															</h4>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={
																	openEditRightSideModal
																}
																className="cursor-pointer"
															>
																<Edit2 className="h-4 w-4" />
															</Button>
														</div>

														<div className="space-y-4">
															<div className="space-y-1">
																<Label className="text-xs text-gray-500">
																	Risk Level
																</Label>
																{profile.risk_level ? (
																	<Badge
																		variant={
																			profile.risk_level ===
																			"Low"
																				? "secondary"
																				: profile.risk_level ===
																					  "Medium"
																					? "default"
																					: "destructive"
																		}
																		className={`w-fit ${
																			profile.risk_level ===
																			"High"
																				? "text-white"
																				: ""
																		}`}
																	>
																		{
																			profile.risk_level
																		}
																	</Badge>
																) : (
																	<p className="text-base font-medium text-gray-900">
																		_
																	</p>
																)}
															</div>

															<div className="space-y-1">
																<Label className="text-xs text-gray-500">
																	Status
																</Label>
																<p className="text-base font-medium text-gray-900">
																	{profile.status
																		? profile.status
																		: "_"}
																</p>
															</div>

															<div>
																<h4 className="text-xs font-semibold text-gray-600 tracking-wide mb-2">
																	Notes
																</h4>
																{profile.notes ? (
																	<p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
																		{
																			profile.notes
																		}
																	</p>
																) : (
																	<p className="text-sm text-gray-400 italic">
																		No notes
																	</p>
																)}
															</div>
														</div>
													</div>
												</div>

												<Separator />

												<div className="flex flex-col gap-2">
													{profile.created_at && (
														<div className="flex flex-row items-center gap-3">
															<Label className="text-xs text-gray-500 w-20">
																Created At
															</Label>
															<p className="text-xs font-medium text-gray-600">
																{new Date(
																	profile.created_at,
																).toLocaleString()}
															</p>
														</div>
													)}

													{profile.updated_at && (
														<div className="flex flex-row items-center gap-3">
															<Label className="text-xs text-gray-500 w-20">
																Updated At
															</Label>
															<p className="text-xs font-medium text-gray-600">
																{new Date(
																	profile.updated_at,
																).toLocaleString()}
															</p>
														</div>
													)}
												</div>
											</div>
										</TabsContent>
										<TabsContent value="analytics">
											<div className="space-y-2">
												{sortedProfileCases.length ===
												0 ? (
													<p className="text-sm text-gray-500">
														No cases linked to this
														profile.
													</p>
												) : (
													<div className="space-y-3">
														{paginatedProfileCases.map(
															(item) => (
																<Card
																	key={
																		item.id
																	}
																	className="cursor-pointer gap-2 hover:bg-blue-50/50 transition-colors"
																	onClick={() =>
																		navigate(
																			`/case/${item.id}`,
																		)
																	}
																>
																	<CardContent className="pt-2 space-y-2 pb-2">
																		<div className="flex items-start gap-2">
																			<Badge
																				variant="secondary"
																				className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
																			>
																				<FileText className="h-3 w-3" />
																				Info
																			</Badge>
																			<div className="flex-1 space-y-1 font-semibold">
																				<div className="flex items-start justify-between gap-3 text-sm text-gray-700">
																					<div className="min-w-0 flex items-center gap-2 flex-wrap">
																						{item.case_id && (
																							<span>
																								{
																									item.case_id
																								}
																							</span>
																						)}
																						{item.case_id &&
																							item.case_name && (
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
																						{item.case_name && (
																							<span>
																								{truncateName(
																									item.case_name,
																								)}
																							</span>
																						)}
																					</div>
																					<div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">
																						{item.case_type && (
																							<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																								{formatBadgeValue(
																									item.case_type,
																								)}
																							</span>
																						)}
																						{item.severity_level && (
																							<span
																								className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(item.severity_level)}`}
																							>
																								{formatBadgeValue(
																									item.severity_level,
																								)}
																							</span>
																						)}
																						{item.status && (
																							<span
																								className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
																							>
																								{formatBadgeValue(
																									item.status,
																								)}
																							</span>
																						)}
																					</div>
																				</div>

																				{(item.case_date ||
																					item.case_time ||
																					item.description) && (
																					<div className="flex items-center gap-2 flex-wrap text-sm text-gray-700">
																						{(item.case_date ||
																							item.case_time) && (
																							<>
																								{item.case_date && (
																									<span>
																										{item.case_time
																											? (() => {
																													try {
																														const dateObj =
																															new Date(
																																item.case_date,
																															);
																														const [
																															hours,
																															minutes,
																														] =
																															item.case_time.split(
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
																															item.case_date,
																														).toLocaleDateString();
																													}
																												})()
																											: new Date(
																													item.case_date,
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
																								{!item.case_date &&
																									item.case_time && (
																										<span>
																											{
																												item.case_time
																											}
																										</span>
																									)}
																								{item.description && (
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
																							</>
																						)}
																						{item.description && (
																							<span>
																								{(() => {
																									const formatted =
																										formatTextWithNewlineIndicator(
																											item.description ||
																												"",
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

																		{item.profiles &&
																			item
																				.profiles
																				.length >
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
																						{item.profiles.map(
																							(
																								p,
																							) => (
																								<span
																									key={
																										p[0]
																									}
																									onClick={(
																										e,
																									) => {
																										e.stopPropagation();
																										navigate(
																											`/profile/${p[0]}`,
																										);
																									}}
																									className="cursor-pointer hover:underline text-blue-600 hover:text-blue-800"
																								>
																									{truncateName(
																										p[1],
																									)}
																									{item.profiles!.indexOf(
																										p,
																									) !==
																										item
																											.profiles!
																											.length -
																											1 &&
																										", "}
																								</span>
																							),
																						)}
																					</div>
																				</div>
																			)}

																		{item.drugs &&
																			item
																				.drugs
																				.length >
																				0 && (
																				<div className="flex items-start gap-2">
																					<Badge
																						variant="secondary"
																						className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
																					>
																						<Pill className="h-3 w-3" />
																						Drugs
																					</Badge>
																					<p className="text-sm text-gray-700 font-semibold">
																						{item.drugs.map(
																							(
																								d,
																								index,
																							) => (
																								<span
																									key={`${d.drug_name}-${index}`}
																								>
																									{`${truncateName(d.drug_name)}(${d.quantified_by}): ${d.quantity}`}
																									{index !==
																										item
																											.drugs!
																											.length -
																											1 &&
																										", "}
																								</span>
																							),
																						)}
																					</p>
																				</div>
																			)}

																		{item.areas &&
																			item
																				.areas
																				.length >
																				0 && (
																				<div className="flex items-start gap-2">
																					<Badge
																						variant="secondary"
																						className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
																					>
																						<MapPin className="h-3 w-3" />
																						Areas
																					</Badge>
																					<p className="text-sm text-gray-700 font-semibold">
																						{item.areas.map(
																							(
																								area,
																								index,
																							) => (
																								<span
																									key={`${area}-${index}`}
																								>
																									{
																										area
																									}
																									{index !==
																										item
																											.areas!
																											.length -
																											1 &&
																										", "}
																								</span>
																							),
																						)}
																					</p>
																				</div>
																			)}

																		{item.notes && (
																			<div className="flex items-start gap-2">
																				<Badge
																					variant="secondary"
																					className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-xs"
																				>
																					<MessageSquare className="h-3 w-3" />
																					Notes
																				</Badge>
																				<p className="text-sm text-gray-700 truncate font-semibold">
																					{formatTextWithNewlineIndicator(
																						item.notes,
																					)}
																				</p>
																			</div>
																		)}

																		{item.created_at && (
																			<p className="text-xs text-gray-500 mt-3">
																				Created
																				At:{" "}
																				{new Date(
																					item.created_at,
																				).toLocaleDateString(
																					"en-US",
																					{
																						month: "short",
																						day: "numeric",
																						year: "numeric",
																					},
																				) +
																					" @ " +
																					new Date(
																						item.created_at,
																					).toLocaleTimeString(
																						"en-US",
																						{
																							hour: "2-digit",
																							minute: "2-digit",
																							hour12: true,
																						},
																					)}
																				{item.updated_at && (
																					<>
																						<span
																							className={
																								dividerClass
																							}
																						>
																							{
																								dividerText
																							}
																						</span>
																						Updated
																						At:{" "}
																						{new Date(
																							item.updated_at,
																						).toLocaleDateString(
																							"en-US",
																							{
																								month: "short",
																								day: "numeric",
																								year: "numeric",
																							},
																						) +
																							" @ " +
																							new Date(
																								item.updated_at,
																							).toLocaleTimeString(
																								"en-US",
																								{
																									hour: "2-digit",
																									minute: "2-digit",
																									hour12: true,
																								},
																							)}
																					</>
																				)}
																			</p>
																		)}
																	</CardContent>
																</Card>
															),
														)}

														{totalCasePages > 1 && (
															<div className="space-y-2 pt-1">
																<p className="text-xs text-gray-500 text-center">
																	Page{" "}
																	{
																		casesCurrentPage
																	}{" "}
																	of{" "}
																	{
																		totalCasePages
																	}{" "}
																	• Showing{" "}
																	{(casesCurrentPage -
																		1) *
																		PROFILE_CASES_PER_PAGE +
																		1}
																	-
																	{Math.min(
																		casesCurrentPage *
																			PROFILE_CASES_PER_PAGE,
																		sortedProfileCases.length,
																	)}
																</p>
																<Pagination>
																	<PaginationContent>
																		<PaginationItem>
																			<PaginationPrevious
																				href="#"
																				onClick={(
																					e,
																				) => {
																					e.preventDefault();
																					if (
																						casesCurrentPage >
																						1
																					) {
																						setCasesCurrentPage(
																							(
																								prev,
																							) =>
																								Math.max(
																									1,
																									prev -
																										1,
																								),
																						);
																					}
																				}}
																				aria-disabled={
																					casesCurrentPage ===
																					1
																				}
																				className={
																					casesCurrentPage ===
																					1
																						? "pointer-events-none opacity-50"
																						: undefined
																				}
																			/>
																		</PaginationItem>

																		{casePageWindow[0] >
																			1 && (
																			<>
																				<PaginationItem>
																					<PaginationLink
																						href="#"
																						onClick={(
																							e,
																						) => {
																							e.preventDefault();
																							setCasesCurrentPage(
																								1,
																							);
																						}}
																						isActive={
																							casesCurrentPage ===
																							1
																						}
																					>
																						1
																					</PaginationLink>
																				</PaginationItem>
																				{casePageWindow[0] >
																					2 && (
																					<PaginationItem>
																						<PaginationEllipsis />
																					</PaginationItem>
																				)}
																			</>
																		)}

																		{casePageWindow.map(
																			(
																				page,
																			) => (
																				<PaginationItem
																					key={
																						page
																					}
																				>
																					<PaginationLink
																						href="#"
																						onClick={(
																							e,
																						) => {
																							e.preventDefault();
																							setCasesCurrentPage(
																								page,
																							);
																						}}
																						isActive={
																							casesCurrentPage ===
																							page
																						}
																					>
																						{
																							page
																						}
																					</PaginationLink>
																				</PaginationItem>
																			),
																		)}

																		{casePageWindow[
																			casePageWindow.length -
																				1
																		] <
																			totalCasePages && (
																			<>
																				{casePageWindow[
																					casePageWindow.length -
																						1
																				] <
																					totalCasePages -
																						1 && (
																					<PaginationItem>
																						<PaginationEllipsis />
																					</PaginationItem>
																				)}
																				<PaginationItem>
																					<PaginationLink
																						href="#"
																						onClick={(
																							e,
																						) => {
																							e.preventDefault();
																							setCasesCurrentPage(
																								totalCasePages,
																							);
																						}}
																						isActive={
																							casesCurrentPage ===
																							totalCasePages
																						}
																					>
																						{
																							totalCasePages
																						}
																					</PaginationLink>
																				</PaginationItem>
																			</>
																		)}

																		<PaginationItem>
																			<PaginationNext
																				href="#"
																				onClick={(
																					e,
																				) => {
																					e.preventDefault();
																					if (
																						casesCurrentPage <
																						totalCasePages
																					) {
																						setCasesCurrentPage(
																							(
																								prev,
																							) =>
																								Math.min(
																									totalCasePages,
																									prev +
																										1,
																								),
																						);
																					}
																				}}
																				aria-disabled={
																					casesCurrentPage ===
																					totalCasePages
																				}
																				className={
																					casesCurrentPage ===
																					totalCasePages
																						? "pointer-events-none opacity-50"
																						: undefined
																				}
																			/>
																		</PaginationItem>
																	</PaginationContent>
																</Pagination>
															</div>
														)}
													</div>
												)}
											</div>
										</TabsContent>
										<TabsContent value="reports">
											<div className="space-y-2">
												{aggregatedDrugs.length ===
												0 ? (
													<p className="text-sm text-gray-500">
														No drugs linked in any
														cases.
													</p>
												) : (
													(() => {
														const totalQuantity =
															aggregatedDrugs.reduce(
																(sum, drug) =>
																	sum +
																	drug.total_quantity,
																0,
															);
														return (
															<div className="space-y-4">
																{aggregatedDrugs.map(
																	(
																		drug,
																		index,
																	) => {
																		const percentage =
																			totalQuantity >
																			0
																				? (drug.total_quantity /
																						totalQuantity) *
																					100
																				: 0;
																		const percentageLabel =
																			percentage.toFixed(
																				2,
																			);
																		const barFillClass =
																			percentage <=
																			25
																				? "bg-yellow-400/70"
																				: percentage <=
																					  50
																					? "bg-green-400/70"
																					: percentage <=
																						  75
																						? "bg-rose-400/70"
																						: "bg-violet-400/70";
																		return (
																			<div
																				key={`${drug.drug_name}-${drug.quantified_by}-${index}`}
																				className="border rounded-md px-3 py-2 space-y-2 bg-white"
																			>
																				<div className="flex items-center justify-between">
																					<span className="text-sm font-semibold text-gray-900">
																						{
																							drug.drug_name
																						}{" "}
																						(
																						<span className="text-gray-500 font-medium">
																							{
																								drug.quantified_by
																							}
																						</span>

																						)
																					</span>
																					<span className="text-sm font-semibold text-gray-900">
																						{
																							drug.total_quantity
																						}
																					</span>
																				</div>
																				<div className="flex items-center justify-between">
																					<p className="text-sm text-gray-500">
																						from{" "}
																						{
																							drug.case_count
																						}{" "}
																						{drug.case_count ===
																						1
																							? "case"
																							: "cases"}
																					</p>
																					<p className="text-sm font-medium text-gray-600">
																						{
																							percentageLabel
																						}

																						%
																					</p>
																				</div>
																				<div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
																					<div
																						className={`h-full rounded-full ${barFillClass}`}
																						style={{
																							width: `${Math.max(0, Math.min(100, percentage))}%`,
																						}}
																					/>
																				</div>
																			</div>
																		);
																	},
																)}
															</div>
														);
													})()
												)}
											</div>
										</TabsContent>
										<TabsContent value="settings">
											<div className="space-y-4">
												{sortedConnections.length ===
												0 ? (
													<p className="text-sm text-gray-500">
														No relationships linked
														in database.
													</p>
												) : (
													<div className="space-y-4">
														{sortedConnections.map(
															(connection) => (
																<div
																	key={
																		connection.id
																	}
																	className="border rounded-md px-4 py-3 bg-white"
																>
																	<div className="flex items-start justify-between gap-4">
																		<div className="min-w-0 flex-1 space-y-1">
																			<p className="text-sm font-semibold text-gray-900 leading-5 break-words">
																				{
																					connection.target_full_name
																				}
																			</p>
																			{connection.target_alias && (
																				<p className="text-sm text-gray-500 leading-5 break-words">
																					{
																						connection.target_alias
																					}
																				</p>
																			)}
																		</div>
																		<div className="shrink-0 flex flex-col items-end gap-2 text-right">
																			<p className="text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
																				{connection.relationship_type ||
																					"Unspecified"}
																			</p>
																			{connection.linked_case_id && (
																				<button
																					type="button"
																					onClick={() =>
																						navigate(
																							`/case/${connection.linked_case_id}`,
																						)
																					}
																					className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
																				>
																					View
																					Case
																				</button>
																			)}
																		</div>
																	</div>
																</div>
															),
														)}
													</div>
												)}
											</div>
										</TabsContent>
										<TabsContent value="areas">
											<div className="space-y-2">
												{profileAreas.length === 0 ? (
													<p className="text-sm text-gray-500">
														No areas linked in
														database.
													</p>
												) : (
													<div className="space-y-2">
														{profileAreas.map(
															(area) => (
																<div
																	key={
																		area.id
																	}
																	className="flex items-center justify-between border rounded-md px-3 py-2"
																>
																	<p className="text-sm font-medium">
																		{
																			area.name
																		}
																	</p>
																	{area.is_primary ===
																		1 && (
																		<p className="text-xs text-gray-500">
																			Primary
																		</p>
																	)}
																</div>
															),
														)}
													</div>
												)}
											</div>
										</TabsContent>
									</>
								)}
							</Tabs>
						</div>
					</>
				)}
			</div>
		</>
	);
}
