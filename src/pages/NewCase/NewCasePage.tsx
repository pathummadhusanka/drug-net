import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createCaseWithAreas } from "@/lib/cases";
import { getAllAreas, type Area } from "@/lib/areas";
import {
	createProfile,
	getAllProfiles,
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
import {
	Background,
	BackgroundVariant,
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
	Clock,
	Info,
	Trash2,
	UserPlus,
	UserSearch,
	X,
} from "lucide-react";
import { toast } from "sonner";

const CustomNode = ({
	data,
	id,
	isSelected,
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

	const bgColor = data.isCurrentProfile ? "bg-indigo-600" : "bg-white";
	const textColor = data.isCurrentProfile ? "text-white" : "text-black";
	const borderColor = data.isCurrentProfile
		? "border-indigo-700"
		: "border-gray-400";

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
								className="hover:bg-blue-100 hover:bg-opacity-20 text-current hover:text-blue-600 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer p-0 flex-shrink-0"
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
					{data.onDelete && (
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

	const onConnect = useCallback(
		(params: Connection | Edge) => {
			if (params.source === params.target) {
				toast.error("A profile cannot connect to itself", {
					position: "top-center",
				});
				return;
			}

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
	}, [edges, setNodes]);

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

	// Fetch available areas and profiles on mount
	useEffect(() => {
		const fetchAreas = async () => {
			try {
				const allAreas = await getAllAreas();
				setAvailableAreas(allAreas);
			} catch (error) {
				console.error("Failed to fetch areas:", error);
			}
		};

		fetchAreas();
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
		setActiveAccordion("");
		setSelectedDrugs({});
		setDrugSearch("");
		setAreas([]);
		setPendingArea("");
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

	return (
		<div className="w-full mx-auto space-y-1">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">File New Case</h2>
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
				Complete the following steps to file a new case for this
				profile.
			</p>

			<form
				onSubmit={async (e) => {
					e.preventDefault();

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

					try {
						// Create case with areas
						await createCaseWithAreas(
							{
								case_id: caseId || null,
								case_name: caseTitle || "Untitled Case",
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

						toast.success("Case has been filed successfully!", {
							position: "top-center",
						});

						// Navigate back or to cases page
						setTimeout(() => navigate("/cases"), 1000);
					} catch (error) {
						console.error("Failed to create case:", error);
						toast.error("Failed to file case. Please try again.", {
							position: "top-center",
						});
					}
				}}
				className="space-y-4"
			>
				<Accordion
					type="single"
					collapsible
					value={activeAccordion}
					onValueChange={(value) => setActiveAccordion(value || "")}
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
									<span>[1] Case Details</span>
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
									<Label htmlFor="case-type">Case Type</Label>
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
													Trafficking - Large scale
													transportation or movement
													of illegal drugs across
													regions or borders
												</ComboboxItem>
												<ComboboxItem value="distribution">
													Distribution - Supplying or
													selling drugs within a
													network
												</ComboboxItem>
												<ComboboxItem value="possession">
													Possession - Individual
													found holding illegal drugs
													(personal or commercial
													quantity)
												</ComboboxItem>
												<ComboboxItem value="manufacturing">
													Manufacturing - Production
													or processing of narcotics
												</ComboboxItem>
												<ComboboxItem value="cultivation">
													Cultivation - Growing
													illegal drug producing
													plants
												</ComboboxItem>
												<ComboboxItem value="import-export">
													Import / Export - Cross
													border smuggling of drugs
												</ComboboxItem>
											</ComboboxList>
										</ComboboxContent>
									</Combobox>
								</div>
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="case-title">Title</Label>
									<Input
										id="case-title"
										name="title"
										placeholder="Enter case title"
										maxLength={100}
										value={caseTitle}
										onChange={(e) =>
											setCaseTitle(e.target.value)
										}
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
											setCaseDescription(e.target.value);
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
									<div className="relative">
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
												onClick={() => setCaseDate("")}
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
												onClick={() => setCaseTime("")}
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
									<span>[2] Connections</span>
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
											• {edges.length}{" "}
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
												setIsAddProfileDialogOpen(true);
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
												setIsNewProfileDialogOpen(true);
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
											},
											style: { strokeWidth: 2 },
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
													{editingEdgeId
														? "Edit"
														: "Add"}{" "}
													Connection
												</DialogTitle>
												<DialogDescription>
													{editingEdgeId
														? "Update the"
														: "Create a"}{" "}
													connection between profiles
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4 py-4">
												{pendingConnection && (
													<div className="bg-muted p-3 rounded-md text-sm">
														<div className="flex items-center justify-between gap-2">
															<div className="flex items-center gap-2">
																<span className="font-medium">
																	{
																		nodes.find(
																			(
																				n,
																			) =>
																				n.id ===
																				pendingConnection.source,
																		)?.data
																			.label as string
																	}
																</span>
																<span className="text-muted-foreground">
																	→
																</span>
																<span className="font-medium">
																	{
																		nodes.find(
																			(
																				n,
																			) =>
																				n.id ===
																				pendingConnection.target,
																		)?.data
																			.label as string
																	}
																</span>
															</div>
															{editingEdgeId && (
																<Trash2
																	className="h-4 w-4 text-destructive cursor-pointer hover:text-destructive/80"
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
														Connection Type
													</Label>
													<Input
														id="connection-type"
														name="connectionType"
														placeholder="e.g., Supplier, Associate, Family, Known Contact"
														value={connectionLabel}
														onChange={(e) =>
															setConnectionLabel(
																e.target.value,
															)
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
												<DialogTitle>
													Create New Profile
												</DialogTitle>
												<DialogDescription>
													Create a profile and add it
													to this case network
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
														value={
															newProfileFullName
														}
														onChange={(e) =>
															setNewProfileFullName(
																e.target.value,
															)
														}
														required
														autoFocus
													/>
												</div>
												<div className="grid gap-2">
													<Label htmlFor="new-profile-nic">
														NIC
													</Label>
													<Input
														id="new-profile-nic"
														placeholder="Optional (must be unique)"
														value={newProfileNic}
														onChange={(e) =>
															setNewProfileNic(
																e.target.value,
															)
														}
													/>
												</div>
												<div className="grid gap-2">
													<Label htmlFor="new-profile-alias">
														Alias
													</Label>
													<Input
														id="new-profile-alias"
														placeholder="Optional"
														value={newProfileAlias}
														onChange={(e) =>
															setNewProfileAlias(
																e.target.value,
															)
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
														value={
															newProfileAddressLine1
														}
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
														value={
															newProfileAddressLine2
														}
														onChange={(e) =>
															setNewProfileAddressLine2(
																e.target.value,
															)
														}
													/>
												</div>
												<div className="grid gap-2">
													<Label htmlFor="new-profile-city">
														City
													</Label>
													<Input
														id="new-profile-city"
														placeholder="Optional"
														value={newProfileCity}
														onChange={(e) =>
															setNewProfileCity(
																e.target.value,
															)
														}
													/>
												</div>

												<div className="grid gap-2">
													<Label htmlFor="new-profile-notes">
														Notes
													</Label>
													<Textarea
														ref={newProfileNotesRef}
														id="new-profile-notes"
														maxLength={500}
														placeholder="Include notes"
														value={newProfileNotes}
														onChange={(e) =>
															setNewProfileNotes(
																e.target.value,
															)
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
														onClick={
															resetNewProfileForm
														}
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
															disabled={
																isCreatingProfile
															}
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

								{/* Profile Selection Dialog */}
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
											<DialogTitle>
												Add Profile to Case
											</DialogTitle>
											<DialogDescription>
												Search and select a profile from
												the database
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<Input
												placeholder="Search by name or alias..."
												value={profileSearch}
												onChange={(e) =>
													setProfileSearch(
														e.target.value,
													)
												}
												autoFocus
											/>
											<div className="max-h-80 overflow-y-auto rounded-md border">
												{(() => {
													const filteredProfiles =
														availableProfiles
															.map((profile) => ({
																profile,
																...fuzzyMatch(
																	profileSearch,
																	`${profile.full_name} ${profile.alias || ""}`,
																),
															}))
															.filter(
																({ match }) =>
																	match,
															)
															.sort(
																(a, b) =>
																	b.score -
																	a.score,
															)
															.slice(0, 50);

													if (
														availableProfiles.length ===
														0
													) {
														return (
															<div className="p-4 text-center text-sm text-muted-foreground">
																No profiles
																found in
																database
															</div>
														);
													}

													if (
														filteredProfiles.length ===
														0
													) {
														return (
															<div className="p-4 text-center text-sm text-muted-foreground">
																No matching
																profiles found
															</div>
														);
													}

													return filteredProfiles.map(
														({ profile }) => {
															const isProfileAdded =
																nodes.some(
																	(node) =>
																		node
																			.data
																			?.profileId ===
																		profile.id,
																);

															return (
																<button
																	key={
																		profile.id
																	}
																	type="button"
																	disabled={
																		isProfileAdded
																	}
																	onClick={() => {
																		addNode(
																			profile,
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
																				profile.full_name
																			}
																		</span>
																		{profile.alias && (
																			<span className="text-sm text-muted-foreground">
																				Alias:{" "}
																				{
																					profile.alias
																				}
																			</span>
																		)}
																		{profile.city && (
																			<span className="text-xs text-muted-foreground">
																				{
																					profile.city
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

								<p className="text-sm text-gray-500">
									Click "Add Profile" to select profiles from
									the database. Drag profiles to reposition
									them, and drag from one profile's edge to
									another to create connections.
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
									{completedSections.includes("drugs") && (
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
												setDrugSearch(e.target.value)
											}
										/>
										<ComboboxContent>
											<ComboboxList>
												{availableDrugs
													.filter((drug) => {
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
													})
													.map((drug) => {
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
																{displayName}
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
											([drugName, quantity]) => (
												<div
													key={drugName}
													className="flex items-center gap-3"
												>
													<div className="flex-1 flex items-center gap-3">
														<Label
															htmlFor={`quantity-${drugName}`}
															className="text-sm font-medium min-w-fit whitespace-nowrap"
														>
															{drugName}:
														</Label>
														<Input
															id={`quantity-${drugName}`}
															type="text"
															placeholder="Enter quantity"
															value={quantity}
															onChange={(e) =>
																handleDrugQuantityChange(
																	drugName,
																	e.target
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
							activeAccordion === "areas"
								? "border-l-4 border-blue-500 bg-blue-50/50"
								: ""
						}
					>
						<AccordionTrigger className="cursor-pointer hover:bg-gray-50 transition-colors px-2">
							<div className="flex justify-between items-center w-full mr-2">
								<div className="flex items-center gap-2">
									{completedSections.includes("areas") && (
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
												setPendingArea(e.target.value)
											}
											onKeyDown={(e) => {
												if (
													e.key === "Enter" ||
													e.key === "," ||
													e.key === " "
												) {
													e.preventDefault();
													if (pendingArea.trim()) {
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
															b.score - a.score,
													)
													.map(({ area }) => (
														<ComboboxItem
															key={area.id}
															value={area.name}
															onClick={() => {
																const newAreas =
																	new Set([
																		...areas,
																		area.name,
																	]);
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
																	new Set([
																		...areas,
																		pendingArea.trim(),
																	]);
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
									{completedSections.includes("notes") && (
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
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				<div className="flex justify-between pt-4">
					<Button
						type="button"
						variant="outline"
						className="cursor-pointer"
						onClick={clearAll}
					>
						Clear All
					</Button>
					<div className="flex gap-4">
						<Button
							type="button"
							variant="outline"
							className="cursor-pointer"
							onClick={() => {
								console.log("Save draft");
							}}
						>
							Save Draft
						</Button>
						<Button type="submit" className="cursor-pointer">
							Save Case
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
}
