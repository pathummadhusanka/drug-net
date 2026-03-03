import { useEffect, useMemo, useState } from "react";
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
import { CircleHelp, User } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	getAllCases,
	getCaseProfiles,
	getCaseRelationships,
} from "@/lib/cases";
import { getProfile } from "@/lib/profiles";
import { toast } from "sonner";

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
							pointerEvents: "none",
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
						</div>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
};

const nodeTypes = {
	custom: ReadOnlyNetworkNode,
};

const edgeTypes = {
	custom: ReadOnlyNetworkEdge,
};

export default function NetworkPage() {
	const [loading, setLoading] = useState(true);
	const [nodes, setNodes, onNodesChange] = useNodesState<NetworkNodeData>([]);
	const [edges, setEdges] = useEdgesState<NetworkEdgeData>([]);

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

				const newNodes: Node<NetworkNodeData>[] = uniqueIds.map(
					(profileId) => {
						const details = profileDetailMap.get(profileId);
						const position = generateNonOverlappingPosition(
							positions,
							canvasWidth,
							canvasHeight,
							minDistance,
						);
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
					}
				}

				const newEdges: Edge<NetworkEdgeData>[] = Array.from(
					edgeMap.entries(),
				).map(([key, value]) => {
					const relationshipTypes = Array.from(
						value.relationshipTypes,
					);
					const caseNames = Array.from(value.caseNames);
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
						},
					};
				});

				setNodes(newNodes);
				setEdges(newEdges);
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
	);
}
