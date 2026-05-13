import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type MouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
	Background,
	BackgroundVariant,
	BaseEdge,
	Controls,
	Edge,
	EdgeLabelRenderer,
	EdgeProps,
	Handle,
	MiniMap,
	Node,
	Position,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "reactflow";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import {
	CircleHelp,
	User,
	Eye,
	FileText,
	Network,
	Pill,
	MapPin,
	MessageSquare,
} from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogFooter,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	getAllCases,
	getCase,
	getCaseProfiles,
	getCaseRelationships,
	getCaseAreas,
} from "@/lib/cases";
import { getCaseDrugs } from "@/lib/drugs";
import { getProfile } from "@/lib/profiles";
import {
	getNetworkNodePositions,
	syncNetworkNodePositions,
	upsertNetworkNodePositions,
} from "@/lib/network";
import { toast } from "sonner";
import { formatAuditTimestamp } from "@/lib/datetime";
import { useAppTimeZone } from "@/hooks/useAppTimeZone";

type NetworkNodeData = {
	label: string;
	fullName?: string;
	nic?: string | null;
	alias?: string | null;
	city?: string | null;
	caseCount?: number;
};

type NetworkEdgeData = {
	label: string;
	caseNames: string[];
	relationshipTypes: string[];
	caseIds?: number[];
};

const ReadOnlyNetworkNode = ({ data }: { data: NetworkNodeData }) => {
	const [tooltipOpen, setTooltipOpen] = useState(false);

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

	const tooltipParts = [];
	if (data.fullName) tooltipParts.push(data.fullName);
	if (data.nic) tooltipParts.push(`NIC: ${data.nic}`);
	if (data.alias) tooltipParts.push(`Alias: ${data.alias}`);
	if (data.city) tooltipParts.push(`City: ${data.city}`);
	if (typeof data.caseCount === "number") {
		tooltipParts.push(`Cases: ${data.caseCount}`);
	}

	return (
		<div className="relative h-12 w-12 overflow-visible">
			<Handle
				type="target"
				position={Position.Top}
				style={{ opacity: 0, pointerEvents: "none" }}
			/>
			<Handle
				type="source"
				position={Position.Top}
				style={{ opacity: 0, pointerEvents: "none" }}
			/>
			<div className="h-12 w-12 rounded-full border border-gray-500 bg-white shadow-sm">
				<User className="mx-auto mt-3 h-6 w-6 text-gray-500" />
			</div>

			<div className="absolute -right-5 -top-1 flex items-center gap-1">
				<Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
					<TooltipTrigger asChild>
						<button
							onClick={(event) => {
								event.stopPropagation();
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

const ReadOnlyNetworkEdge = ({
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

	const dx = resolvedTargetX - resolvedSourceX;
	const dy = resolvedTargetY - resolvedSourceY;
	const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

	const nodeRadius = 24;
	const arrowOffset = 8;

	const edgeSourceX = resolvedSourceX + (dx / length) * nodeRadius;
	const edgeSourceY = resolvedSourceY + (dy / length) * nodeRadius;
	const edgeTargetX =
		resolvedTargetX - (dx / length) * (nodeRadius + arrowOffset);
	const edgeTargetY =
		resolvedTargetY - (dy / length) * (nodeRadius + arrowOffset);

	const midX = (edgeSourceX + edgeTargetX) / 2;
	const midY = (edgeSourceY + edgeTargetY) / 2;
	const edgePath = `M ${edgeSourceX},${edgeSourceY} L ${edgeTargetX},${edgeTargetY}`;

	const displayLabel =
		label.length > 20 ? `${label.substring(0, 20)}...` : label;

	const gradientId = `edge-gradient-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
			{displayLabel && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`,
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
							title={(
								data as NetworkEdgeData | undefined
							)?.caseNames?.join(", ")}
						>
							<div className="cursor-default">{displayLabel}</div>
							{(data as NetworkEdgeData | undefined)?.caseIds
								?.length ? (
								<button
									type="button"
									className="w-4 h-4 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
									title="View related case"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										window.dispatchEvent(
											new CustomEvent(
												"open-relationship-info-dialog",
												{
													detail: {
														linkedCaseId: (
															data as NetworkEdgeData
														).caseIds?.[0],
														relationshipType: (
															data as NetworkEdgeData
														).label,
													},
												},
											),
										);
									}}
								>
									<Eye className="h-2.5 w-2.5" />
								</button>
							) : null}
						</div>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
};

export default function NetworkPage() {
	const navigate = useNavigate();
	const appTimeZone = useAppTimeZone();
	const [loading, setLoading] = useState(true);
	const [nodes, setNodes, onNodesChange] = useNodesState<NetworkNodeData>([]);
	const [edges, setEdges] = useEdgesState<NetworkEdgeData>([]);
	const [isRelationshipInfoDialogOpen, setIsRelationshipInfoDialogOpen] =
		useState(false);
	const [relationshipCaseData, setRelationshipCaseData] = useState<any>(null);
	const nodeTypes = useMemo(() => ({ custom: ReadOnlyNetworkNode }), []);
	const edgeTypes = useMemo(() => ({ custom: ReadOnlyNetworkEdge }), []);

	const handleNodeDragStop = useCallback(
		async (_event: MouseEvent, node: Node<NetworkNodeData>) => {
			const profileId = Number(node.id);
			if (Number.isNaN(profileId)) return;

			try {
				await upsertNetworkNodePositions([
					{
						profile_id: profileId,
						x: node.position.x,
						y: node.position.y,
					},
				]);
			} catch (error) {
				console.error("Failed to persist node position:", error);
			}
		},
		[],
	);

	useEffect(() => {
		const loadUnifiedNetwork = async () => {
			try {
				setLoading(true);

				const allCases = await getAllCases();
				if (allCases.length === 0) {
					setNodes([]);
					setEdges([]);
					return;
				}

				const caseNetworkData = await Promise.all(
					allCases.map(async (singleCase) => {
						const [profiles, relationships] = await Promise.all([
							getCaseProfiles(singleCase.id),
							getCaseRelationships(singleCase.id),
						]);

						return {
							caseId: singleCase.id,
							caseName: singleCase.case_name,
							profiles,
							relationships,
						};
					}),
				);

				const profileCaseMap = new Map<number, Set<number>>();
				const uniqueProfileIds = new Set<number>();

				for (const network of caseNetworkData) {
					for (const [profileId] of network.profiles) {
						uniqueProfileIds.add(profileId);
						if (!profileCaseMap.has(profileId)) {
							profileCaseMap.set(profileId, new Set<number>());
						}
						profileCaseMap.get(profileId)?.add(network.caseId);
					}

					for (const rel of network.relationships) {
						uniqueProfileIds.add(rel.source_profile_id);
						uniqueProfileIds.add(rel.target_profile_id);

						if (!profileCaseMap.has(rel.source_profile_id)) {
							profileCaseMap.set(
								rel.source_profile_id,
								new Set<number>(),
							);
						}
						if (!profileCaseMap.has(rel.target_profile_id)) {
							profileCaseMap.set(
								rel.target_profile_id,
								new Set<number>(),
							);
						}

						profileCaseMap
							.get(rel.source_profile_id)
							?.add(network.caseId);
						profileCaseMap
							.get(rel.target_profile_id)
							?.add(network.caseId);
					}
				}

				const uniqueIds = Array.from(uniqueProfileIds);
				const savedPositions = await getNetworkNodePositions();
				const savedPositionMap = new Map<
					number,
					{ x: number; y: number }
				>();
				for (const saved of savedPositions) {
					savedPositionMap.set(saved.profile_id, {
						x: saved.x,
						y: saved.y,
					});
				}
				const profileDetailsList = await Promise.all(
					uniqueIds.map((id) => getProfile(id)),
				);
				const profileDetailMap = new Map<
					number,
					Awaited<ReturnType<typeof getProfile>>
				>();
				uniqueIds.forEach((id, idx) => {
					profileDetailMap.set(id, profileDetailsList[idx]);
				});

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
							margin +
							Math.random() * (canvasHeight - 2 * margin);

						const isFarEnough = existingPositions.every((pos) => {
							const dx = pos.x - x;
							const dy = pos.y - y;
							const distance = Math.sqrt(dx * dx + dy * dy);
							return distance >= minDistance;
						});

						if (!isFarEnough) {
							continue;
						}

						let createsCollinearTriple = false;
						for (
							let i = 0;
							i < existingPositions.length - 1 &&
							!createsCollinearTriple;
							i++
						) {
							for (
								let j = i + 1;
								j < existingPositions.length;
								j++
							) {
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

					return {
						x: margin + Math.random() * (canvasWidth - 2 * margin),
						y: margin + Math.random() * (canvasHeight - 2 * margin),
					};
				};

				const canvasWidth = 1800;
				const canvasHeight = 1100;
				const minDistance = 180;
				const positions: { x: number; y: number }[] = [];
				const positionsToPersist: {
					profile_id: number;
					x: number;
					y: number;
				}[] = [];

				const newNodes: Node<NetworkNodeData>[] = uniqueIds.map(
					(profileId) => {
						const details = profileDetailMap.get(profileId);
						let position = savedPositionMap.get(profileId);
						if (!position) {
							position = generateNonOverlappingPosition(
								positions,
								canvasWidth,
								canvasHeight,
								minDistance,
							);
							positionsToPersist.push({
								profile_id: profileId,
								x: position.x,
								y: position.y,
							});
						}
						positions.push(position);

						return {
							id: profileId.toString(),
							type: "custom",
							position,
							data: {
								label:
									details?.full_name ||
									`Profile ${profileId}`,
								fullName: details?.full_name || undefined,
								nic: details?.nic || null,
								alias: details?.alias || null,
								city: details?.city || null,
								caseCount:
									profileCaseMap.get(profileId)?.size ?? 0,
							},
						};
					},
				);

				const edgeMap = new Map<
					string,
					{
						source: string;
						target: string;
						relationshipTypes: Set<string>;
						caseNames: Set<string>;
						caseIds: Set<number>;
					}
				>();

				for (const network of caseNetworkData) {
					for (const rel of network.relationships) {
						const source = rel.source_profile_id.toString();
						const target = rel.target_profile_id.toString();
						if (source === target) continue;

						const [a, b] = [source, target].sort(
							(left, right) => Number(left) - Number(right),
						);
						const key = `${a}-${b}`;

						if (!edgeMap.has(key)) {
							edgeMap.set(key, {
								source: a,
								target: b,
								relationshipTypes: new Set<string>(),
								caseNames: new Set<string>(),
								caseIds: new Set<number>(),
							});
						}

						const existing = edgeMap.get(key);
						if (!existing) continue;

						if (rel.relationship_type?.trim()) {
							existing.relationshipTypes.add(
								rel.relationship_type.trim(),
							);
						}
						existing.caseNames.add(
							network.caseName || `Case ${network.caseId}`,
						);
						existing.caseIds.add(network.caseId);
					}
				}

				const newEdges: Edge<NetworkEdgeData>[] = Array.from(
					edgeMap.entries(),
				).map(([key, value]) => {
					const relationshipTypes = Array.from(
						value.relationshipTypes,
					);
					const caseNames = Array.from(value.caseNames);
					const caseIds = Array.from(value.caseIds);
					const label =
						relationshipTypes.length > 0
							? relationshipTypes.join(" | ")
							: `${caseNames.length} case${caseNames.length === 1 ? "" : "s"}`;

					return {
						id: `edge-${key}`,
						source: value.source,
						target: value.target,
						type: "custom",
						data: {
							label,
							caseNames,
							relationshipTypes,
							caseIds,
						},
					};
				});

				setNodes(newNodes);
				setEdges(newEdges);

				await syncNetworkNodePositions(uniqueIds);
				if (positionsToPersist.length > 0) {
					await upsertNetworkNodePositions(positionsToPersist);
				}
			} catch (error) {
				console.error("Failed to load network:", error);
				toast.error("Failed to load unified network", {
					position: "top-center",
				});
			} finally {
				setLoading(false);
			}
		};

		loadUnifiedNetwork();
	}, [setEdges, setNodes]);

	useEffect(() => {
		const handleOpenRelationshipInfoDialog = (event: Event) => {
			const customEvent = event as CustomEvent<{
				linkedCaseId: number | null;
				relationshipType: string;
			}>;

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
			"open-relationship-info-dialog",
			handleOpenRelationshipInfoDialog,
		);

		return () => {
			window.removeEventListener(
				"open-relationship-info-dialog",
				handleOpenRelationshipInfoDialog,
			);
		};
	}, []);

	const summary = useMemo(() => {
		return {
			nodes: nodes.length,
			edges: edges.length,
		};
	}, [nodes.length, edges.length]);

	if (loading) {
		return (
			<div className="container mx-auto flex items-center justify-center py-12">
				<p className="text-gray-500">Loading unified network...</p>
			</div>
		);
	}

	return (
		<>
			<div className="w-full mx-auto space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold text-gray-700">
						Unified Network
					</h3>
					<div className="text-xs text-gray-500">
						{summary.nodes} profiles • {summary.edges} links
					</div>
				</div>

				{summary.nodes > 0 ? (
					<div
						className="w-full bg-gray-50 rounded border border-gray-200"
						style={{ height: "calc(100vh - 180px)" }}
					>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							nodeTypes={nodeTypes}
							edgeTypes={edgeTypes}
							onNodeDragStop={handleNodeDragStop}
							nodesConnectable={false}
							fitView
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
							No network data available across cases
						</p>
					</div>
				)}
			</div>

			<AlertDialog
				open={isRelationshipInfoDialogOpen}
				onOpenChange={(open) => {
					setIsRelationshipInfoDialogOpen(open);
					if (!open) {
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
										{formatAuditTimestamp(
											relationshipCaseData.created_at,
											appTimeZone,
										)}
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
						{relationshipCaseData?.id && (
							<Button
								variant="default"
								onClick={() => {
									setIsRelationshipInfoDialogOpen(false);
									navigate(
										`/case/${relationshipCaseData.id}`,
									);
								}}
							>
								Go to Case
							</Button>
						)}
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
