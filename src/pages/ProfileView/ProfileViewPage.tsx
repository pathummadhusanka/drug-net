import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, X, Check, Calendar, Clock } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import ReactFlow, {
	MiniMap,
	Controls,
	Background,
	BackgroundVariant,
	addEdge,
	Connection,
	Edge,
	Node,
	useNodesState,
	useEdgesState,
	MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
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
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";

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
}

export default function ProfileView() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<Profile | null>(null);
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

	// Connection dialog state
	const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
	const [pendingConnection, setPendingConnection] = useState<
		Connection | Edge | null
	>(null);
	const [connectionLabel, setConnectionLabel] = useState("");

	// React Flow state
	const initialNodes: Node[] = [
		{
			id: "1",
			type: "default",
			data: { label: profile?.full_name || "Current Profile" },
			position: { x: 400, y: 200 },
			style: {
				background: "#4F46E5",
				color: "white",
				border: "2px solid #4338CA",
			},
		},
	];
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [nodeId, setNodeId] = useState(2);

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
	const onConnect = useCallback((params: Connection | Edge) => {
		// Prevent self-loops
		if (params.source === params.target) {
			toast.error("A profile cannot connect to itself", {
				position: "top-center",
			});
			return;
		}

		// Open dialog for edge label/name
		setPendingConnection(params);
		setConnectionLabel("");
		setIsConnectionDialogOpen(true);
	}, []);

	const handleConnectionSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (pendingConnection && connectionLabel.trim()) {
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
			setIsConnectionDialogOpen(false);
			setPendingConnection(null);
			setConnectionLabel("");
		}
	};

	const addNode = useCallback(() => {
		const newNode: Node = {
			id: `${nodeId}`,
			type: "default",
			data: { label: `Profile ${nodeId}` },
			position: {
				x: Math.random() * 400 + 100,
				y: Math.random() * 400 + 50,
			},
		};
		setNodes((nds) => [...nds, newNode]);
		setNodeId((id) => id + 1);
	}, [nodeId, setNodes]);

	// Update initial node when profile loads
	useEffect(() => {
		if (profile) {
			setNodes((nds) =>
				nds.map((node) =>
					node.id === "1"
						? { ...node, data: { label: profile.full_name } }
						: node,
				),
			);
		}
	}, [profile, setNodes]);

	// Auto-resize textarea based on content
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
		const fetchProfile = async () => {
			if (!id) {
				setError("No profile ID provided");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const result = await invoke<Profile | null>("get_profile", {
					id: parseInt(id),
				});

				if (result) {
					setProfile(result);
					setError(null);
				} else {
					setError("No user found");
					setProfile(null);
				}
			} catch (err) {
				console.error("Failed to fetch profile:", err);
				setError("Failed to load profile");
				setProfile(null);
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, [id]);

	return (
		<>
			{/* <Button
				onClick={() => navigate(-1)}
				variant="outline"
				className="mb-4 cursor-pointer"
			>
				<ChevronLeft className="h-4 w-4 mr-2" />
				All Profiles
			</Button> */}

			<div className="w-full mx-auto">
				{loading && (
					<div className="text-center py-8">
						<p className="text-gray-500">Loading profile...</p>
					</div>
				)}

				{error && (
					<div className="text-center py-8">
						<p className="text-red-500 text-lg font-medium">
							{error}
						</p>
					</div>
				)}

				{!loading && !error && profile && (
					<div className="space-y-6">
						<div className="flex items-left flex-col gap-2">
							<h1 className="text-2xl font-bold">
								{profile.full_name}
							</h1>
							<span className="text-lg font-bold">
								[ {profile.alias} ]
							</span>

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
											Connections
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
												setShowFileCaseForm(
													!showFileCaseForm,
												)
											}
										>
											{showFileCaseForm ? (
												<X className="h-4 w-4 mr-2" />
											) : (
												<Plus className="h-4 w-4 mr-2" />
											)}
											{showFileCaseForm
												? "Cancel"
												: "File Case"}
										</Button>
										<Button
											variant="secondary"
											className="cursor-pointer"
											onClick={() =>
												navigate(`/profile/${id}/edit`)
											}
										>
											<MoreVertical className="h-4 w-4" />
										</Button>
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
												console.log("Form submitted");
												setShowFileCaseForm(false);
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
																	(0/7)
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
															<div
																className="border rounded-lg"
																style={{
																	height: "500px",
																}}
															>
																<ReactFlow
																	nodes={
																		nodes
																	}
																	edges={
																		edges
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
																	defaultEdgeOptions={{
																		type: "default",
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
																onOpenChange={
																	setIsConnectionDialogOpen
																}
															>
																<DialogContent className="sm:max-w-md">
																	<form
																		onSubmit={
																			handleConnectionSubmit
																		}
																	>
																		<DialogHeader>
																			<DialogTitle>
																				Add
																				Connection
																			</DialogTitle>
																			<DialogDescription>
																				Create
																				a
																				connection
																				between
																				profiles
																			</DialogDescription>
																		</DialogHeader>
																		<div className="space-y-4 py-4">
																			{pendingConnection && (
																				<div className="bg-muted p-3 rounded-md text-sm">
																					<div className="flex items-center gap-2">
																						<span className="font-medium">
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
																								)
																									?.data
																									.label
																							}
																						</span>
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
																			<DialogClose
																				asChild
																			>
																				<Button
																					variant="outline"
																					type="button"
																				>
																					Cancel
																				</Button>
																			</DialogClose>
																			<Button type="submit">
																				Add
																				Connection
																			</Button>
																		</DialogFooter>
																	</form>
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
																	(1/5)
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
																	(0/2)
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
																	(1/1)
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
														onClick={(e) => {
															e.preventDefault();
															toast.success(
																"Case has been filed successfully!",
																{
																	position:
																		"top-center",
																},
															);
														}}
													>
														Save Case
													</Button>
												</div>
											</div>
										</form>
									</div>
								) : (
									<>
										<TabsContent value="overview">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div className="space-y-2">
													<Label className="text-gray-500">
														Full Name
													</Label>
													<p className="text-lg">
														{profile.full_name}
													</p>
												</div>

												{profile.alias && (
													<div className="space-y-2">
														<Label className="text-gray-500">
															Alias
														</Label>
														<p className="text-lg">
															{profile.alias}
														</p>
													</div>
												)}

												{profile.nic && (
													<div className="space-y-2">
														<Label className="text-gray-500">
															NIC
														</Label>
														<p className="text-lg">
															{profile.nic}
														</p>
													</div>
												)}

												{profile.address_line1 && (
													<div className="space-y-2">
														<Label className="text-gray-500">
															Address Line 1
														</Label>
														<p className="text-lg">
															{
																profile.address_line1
															}
														</p>
													</div>
												)}

												{profile.address_line2 && (
													<div className="space-y-2">
														<Label className="text-gray-500">
															Address Line 2
														</Label>
														<p className="text-lg">
															{
																profile.address_line2
															}
														</p>
													</div>
												)}

												{profile.city && (
													<div className="space-y-2">
														<Label className="text-gray-500">
															City
														</Label>
														<p className="text-lg">
															{profile.city}
														</p>
													</div>
												)}

												{profile.risk_level && (
													<div className="space-y-2">
														<Label className="text-gray-500">
															Risk Level
														</Label>
														<p className="text-lg">
															{profile.risk_level}
														</p>
													</div>
												)}

												{profile.status && (
													<div className="space-y-2">
														<Label className="text-gray-500">
															Status
														</Label>
														<p className="text-lg">
															{profile.status}
														</p>
													</div>
												)}
											</div>

											{profile.notes && (
												<div className="space-y-2">
													<Label className="text-gray-500">
														Notes
													</Label>
													<p className="text-lg whitespace-pre-wrap">
														{profile.notes}
													</p>
												</div>
											)}

											{profile.created_at && (
												<div className="space-y-2 pt-4">
													<Label className="text-gray-500">
														Created At
													</Label>
													<p className="text-sm text-gray-600">
														{new Date(
															profile.created_at,
														).toLocaleString()}
													</p>
												</div>
											)}
										</TabsContent>
										<TabsContent value="analytics"></TabsContent>
										<TabsContent value="reports"></TabsContent>
										<TabsContent value="settings"></TabsContent>
										<TabsContent value="areas"></TabsContent>
									</>
								)}
							</Tabs>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
