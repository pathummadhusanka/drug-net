import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createCaseWithAreas } from "@/lib/cases";
import { getAllAreas, type Area } from "@/lib/areas";
import { getAllProfiles, type ProfileWithId } from "@/lib/profiles";
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
	Node,
	useEdgesState,
	useNodesState,
} from "reactflow";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import {
	Calendar,
	Check,
	ChevronLeft,
	Clock,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { toast } from "sonner";

const CustomNode = ({
	data,
	id,
}: {
	data: {
		label: string;
		profileId?: number;
		isCurrentProfile?: boolean;
		onDelete?: (id: string) => void;
		edges?: Edge[];
	};
	id: string;
}) => {
	const bgColor = data.isCurrentProfile ? "bg-indigo-600" : "bg-white";
	const textColor = data.isCurrentProfile ? "text-white" : "text-black";
	const borderColor = data.isCurrentProfile
		? "border-indigo-700"
		: "border-gray-400";

	const connectionCount = data.edges
		? data.edges.filter((edge) => edge.source === id || edge.target === id)
				.length
		: 0;

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
			{!data.isCurrentProfile && data.onDelete && (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<button
							onClick={(e) => {
								e.stopPropagation();
							}}
							className="absolute -top-1 -right-1 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-400 text-gray-500 hover:text-red-600 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer leading-none p-0 text-[12px]"
							title="Delete profile"
						>
							×
						</button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Profile</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to delete this profile?
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
								className="cursor-pointer"
								onClick={(e: React.MouseEvent) => {
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
			<div className="font-medium">{data.label}</div>
		</div>
	);
};

const nodeTypes = {
	custom: CustomNode,
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
		defaultProfileLabel?: string;
	} | null;
	const defaultProfileLabel = (
		location.state as NewCaseLocationState
	)?.defaultProfileLabel?.trim();
	const hasDefaultProfile = Boolean(defaultProfileLabel);
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

	const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
	const [pendingConnection, setPendingConnection] = useState<
		Connection | Edge | null
	>(null);
	const [connectionLabel, setConnectionLabel] = useState("");
	const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
	const [isValidConnection, setIsValidConnection] = useState(false);

	const initialNodes: Node[] = hasDefaultProfile
		? [
				{
					id: "1",
					type: "custom",
					data: {
						label: defaultProfileLabel || "Current Profile",
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
			setConnectionLabel("");
			setIsConnectionDialogOpen(true);
		},
		[edges],
	);

	const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
		event.preventDefault();
		setEditingEdgeId(edge.id);
		setConnectionLabel((edge.label as string) || "");
		setPendingConnection({
			source: edge.source,
			target: edge.target,
			sourceHandle: edge.sourceHandle ?? null,
			targetHandle: edge.targetHandle ?? null,
		});
		setIsConnectionDialogOpen(true);
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
		if (connectionLabel.trim()) {
			if (editingEdgeId) {
				setEdges((eds) =>
					eds.map((edge) =>
						edge.id === editingEdgeId
							? { ...edge, label: connectionLabel.trim() }
							: edge,
					),
				);
			} else if (pendingConnection) {
				const newEdge = {
					...pendingConnection,
					label: connectionLabel.trim(),
					type: "default",
					markerEnd: {
						type: MarkerType.ArrowClosed,
					},
					style: { strokeWidth: 2 },
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

	const addNode = useCallback(
		(profile: ProfileWithId) => {
			const displayName = profile.alias
				? `${profile.full_name} (${profile.alias})`
				: profile.full_name;

			const newNode: Node = {
				id: `${nodeId}`,
				type: "custom",
				data: {
					label: displayName,
					profileId: profile.id,
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
		[nodeId, setNodes, handleNodeDelete, edges],
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

		const fetchProfiles = async () => {
			try {
				const allProfiles = await getAllProfiles();
				setAvailableProfiles(allProfiles);
			} catch (error) {
				console.error("Failed to fetch profiles:", error);
			}
		};

		fetchAreas();
		fetchProfiles();
	}, []);

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
										<Plus className="h-4 w-4 mr-2" />
										Add Profile
									</Button>
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
											type: "default",
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
									onOpenChange={setIsConnectionDialogOpen}
								>
									<DialogContent className="sm:max-w-md">
										<form onSubmit={handleConnectionSubmit}>
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
											<DialogFooter>
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

								{/* Profile Selection Dialog */}
								<Dialog
									open={isAddProfileDialogOpen}
									onOpenChange={setIsAddProfileDialogOpen}
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
											<Combobox>
												<ComboboxInput
													placeholder="Search by name or alias..."
													showTrigger
													value={profileSearch}
													onChange={(e) =>
														setProfileSearch(
															e.target.value,
														)
													}
													autoFocus
												/>
												<ComboboxContent>
													<ComboboxList>
														{availableProfiles
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
															.slice(0, 50)
															.map(
																({
																	profile,
																}) => (
																	<ComboboxItem
																		key={
																			profile.id
																		}
																		value={
																			profile.full_name
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
																		className="cursor-pointer"
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
																	</ComboboxItem>
																),
															)}
														{availableProfiles.length ===
															0 && (
															<div className="p-4 text-center text-sm text-muted-foreground">
																No profiles
																found in
																database
															</div>
														)}
														{profileSearch &&
															availableProfiles.filter(
																(p) =>
																	fuzzyMatch(
																		profileSearch,
																		`${p.full_name} ${p.alias || ""}`,
																	).match,
															).length === 0 && (
																<div className="p-4 text-center text-sm text-muted-foreground">
																	No matching
																	profiles
																	found
																</div>
															)}
													</ComboboxList>
												</ComboboxContent>
											</Combobox>
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
