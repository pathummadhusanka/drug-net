import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Plus,
	MoreVertical,
	X,
	Check,
	Calendar,
	Clock,
	Trash2,
	ChevronLeft,
	Edit2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useRef, useCallback } from "react";
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
	Node,
	useNodesState,
	useEdgesState,
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

interface ProfileDrug {
	id: number;
	name: string;
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
	relationship_type: string | null;
}

interface CaseWithDetails {
	id: number;
	cno: string;
	case_id: string | null;
	case_name: string;
	created_at: string | null;
}

// Custom node component with 4 connection handles
const CustomNode = ({
	data,
	id,
}: {
	data: {
		label: string;
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

	// Count connections for this node
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

export default function ProfileView() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [profileDrugs, setProfileDrugs] = useState<ProfileDrug[]>([]);
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
	const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
	const [isValidConnection, setIsValidConnection] = useState(false);

	// React Flow state
	const initialNodes: Node[] = [
		{
			id: "1",
			type: "custom",
			data: {
				label: profile?.full_name || "Current Profile",
				isCurrentProfile: true,
				edges: [],
			},
			position: { x: 400, y: 200 },
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
				// Update existing edge
				setEdges((eds) =>
					eds.map((edge) =>
						edge.id === editingEdgeId
							? { ...edge, label: connectionLabel.trim() }
							: edge,
					),
				);
			} else if (pendingConnection) {
				// Create new edge
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

	const addNode = useCallback(() => {
		const newNode: Node = {
			id: `${nodeId}`,
			type: "custom",
			data: {
				label: `Profile ${nodeId}`,
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
	}, [nodeId, setNodes, handleNodeDelete, edges]);

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
				case_id: newCaseId,
				profile_id: profileId,
			});

			const updatedCases = await invoke<CaseWithDetails[]>(
				"get_profile_cases",
				{
					profile_id: profileId,
				},
			);
			setProfileCases(updatedCases);

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
					setProfileDrugs([]);
					setProfileAreas([]);
					setProfileRelationships([]);
					setProfileCases([]);
					setLoading(false);
					return;
				}

				// Profile exists, now fetch related data using allSettled
				// so that if some fail, we still show the profile with empty sections
				const [
					drugsResult,
					areasResult,
					relationshipsResult,
					casesResult,
				] = await Promise.allSettled([
					invoke<ProfileDrug[]>("get_profile_drugs", {
						id: profileId,
					}),
					invoke<ProfileArea[]>("get_profile_areas", {
						id: profileId,
					}),
					invoke<ProfileRelationship[]>("get_profile_relationships", {
						id: profileId,
					}),
					invoke<CaseWithDetails[]>("get_profile_cases", {
						profile_id: profileId,
					}),
				]);

				setProfile(result);
				setProfileDrugs(
					drugsResult.status === "fulfilled" ? drugsResult.value : [],
				);
				setProfileAreas(
					areasResult.status === "fulfilled" ? areasResult.value : [],
				);
				setProfileRelationships(
					relationshipsResult.status === "fulfilled"
						? relationshipsResult.value
						: [],
				);
				setProfileCases(
					casesResult.status === "fulfilled" ? casesResult.value : [],
				);
				setError(null);
			} catch (err) {
				console.error("Failed to fetch profile:", err);
				setError("Failed to load profile");
				setProfile(null);
				setProfileDrugs([]);
				setProfileAreas([]);
				setProfileRelationships([]);
				setProfileCases([]);
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, [id]);

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
												navigate("/new-case", {
													state: {
														defaultProfileLabel:
															profile?.full_name ||
															"Current Profile",
													},
												})
											}
										>
											<Plus className="h-4 w-4 mr-2" />
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
											<DialogContent className="max-w-2xl">
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
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
															<div className="flex gap-3">
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
																							? "default"
																							: level ===
																								  "Medium"
																								? "secondary"
																								: "destructive"
																						: "outline"
																				}
																				className="px-3 py-1 cursor-pointer transition-all"
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
															<FieldGroup className="max-w-sm">
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
															<Textarea
																id="right-notes"
																maxLength={500}
																value={
																	editNotes
																}
																onChange={(
																	event,
																) =>
																	setEditNotes(
																		event
																			.target
																			.value,
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
														className="cursor-pointer"
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
															{profile.risk_level && (
																<div className="space-y-1">
																	<Label className="text-xs text-gray-500">
																		Risk
																		Level
																	</Label>
																	<Badge
																		variant={
																			profile.risk_level ===
																			"Low"
																				? "default"
																				: profile.risk_level ===
																					  "Medium"
																					? "secondary"
																					: "destructive"
																		}
																		className="w-fit"
																	>
																		{
																			profile.risk_level
																		}
																	</Badge>
																</div>
															)}

															{profile.status && (
																<div className="space-y-1">
																	<Label className="text-xs text-gray-500">
																		Status
																	</Label>
																	<p className="text-base font-medium text-gray-900">
																		{
																			profile.status
																		}
																	</p>
																</div>
															)}

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

												{profile.created_at && (
													<div className="space-y-1">
														<Label className="text-xs text-gray-500">
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
													<div className="space-y-1">
														<Label className="text-xs text-gray-500">
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
										</TabsContent>
										<TabsContent value="analytics">
											<div className="space-y-2">
												{profileCases.length === 0 ? (
													<p className="text-sm text-gray-500">
														No cases linked to this
														profile.
													</p>
												) : (
													<div className="space-y-2">
														{profileCases.map(
															(item) => (
																<div
																	key={
																		item.id
																	}
																	className="flex items-center justify-between border rounded-md px-3 py-2"
																>
																	<div className="space-y-0.5">
																		<p className="text-sm font-medium">
																			{
																				item.case_name
																			}
																		</p>
																		<p className="text-xs text-gray-500">
																			{item.case_id ||
																				item.cno}
																		</p>
																	</div>
																	<p className="text-xs text-gray-500">
																		{item.created_at
																			? new Date(
																					item.created_at,
																				).toLocaleDateString()
																			: ""}
																	</p>
																</div>
															),
														)}
													</div>
												)}
											</div>
										</TabsContent>
										<TabsContent value="reports">
											<div className="space-y-2">
												{profileDrugs.length === 0 ? (
													<p className="text-sm text-gray-500">
														No drugs linked in
														database.
													</p>
												) : (
													<div className="flex gap-2 flex-wrap">
														{profileDrugs.map(
															(drug) => (
																<div
																	key={
																		drug.id
																	}
																	className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-sm font-medium text-secondary-foreground"
																>
																	{drug.name}
																</div>
															),
														)}
													</div>
												)}
											</div>
										</TabsContent>
										<TabsContent value="settings">
											<div className="space-y-2">
												{profileRelationships.length ===
												0 ? (
													<p className="text-sm text-gray-500">
														No relationships linked
														in database.
													</p>
												) : (
													<div className="space-y-2">
														{profileRelationships.map(
															(connection) => (
																<div
																	key={
																		connection.id
																	}
																	className="flex items-center justify-between border rounded-md px-3 py-2"
																>
																	<p className="text-sm font-medium">
																		{
																			connection.target_full_name
																		}
																	</p>
																	<p className="text-xs text-gray-500">
																		{connection.relationship_type ||
																			"Unspecified"}
																	</p>
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
