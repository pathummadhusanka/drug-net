import { useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
} from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	getAllCases,
	getCaseAreas,
	getCaseProfiles,
	getCaseRelationships,
} from "@/lib/cases";
import { getCaseDrugs } from "@/lib/drugs";
import { toast } from "sonner";
import { Activity, MapPin, Users, Pill } from "lucide-react";

type DrugDatum = {
	drug: string;
	count: number;
};

type AreaDatum = {
	area: string;
	count: number;
};

type ProfileDatum = {
	name: string;
	count: number;
	connections?: number;
};

type SeverityDatum = {
	level: string;
	count: number;
};

type StatusDatum = {
	status: string;
	count: number;
};

const AREA_COLORS = [
	"#ef4444",
	"#f87171",
	"#dc2626",
	"#b91c1c",
	"#fca5a5",
	"#fecaca",
];

const SEVERITY_COLORS: { [key: string]: string } = {
	Low: "#10b981",
	Medium: "#f59e0b",
	High: "#ef4444",
	Critical: "#7c2d12",
};

const STATUS_COLORS: { [key: string]: string } = {
	Open: "#3b82f6",
	Closed: "#6b7280",
	Pending: "#f59e0b",
	Active: "#10b981",
};

// Metric Card Component
function MetricCard({ icon: Icon, title, value, color }: any) {
	return (
		<Card className="border-l-4" style={{ borderLeftColor: color }}>
			<CardContent className="pt-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-gray-600">
							{title}
						</p>
						<p className="text-3xl font-bold mt-2">{value}</p>
					</div>
					<Icon className="h-8 w-8" style={{ color }} />
				</div>
			</CardContent>
		</Card>
	);
}

export default function AnalyticsPage() {
	const [activeSection, setActiveSection] = useState<
		"overview" | "drugs" | "areas" | "profiles"
	>("overview");
	const [loading, setLoading] = useState(true);
	const [drugData, setDrugData] = useState<DrugDatum[]>([]);
	const [areaData, setAreaData] = useState<AreaDatum[]>([]);
	const [profileData, setProfileData] = useState<ProfileDatum[]>([]);
	const [severityData, setSeverityData] = useState<SeverityDatum[]>([]);
	const [statusData, setStatusData] = useState<StatusDatum[]>([]);
	const [totalCases, setTotalCases] = useState(0);
	const [totalProfiles, setTotalProfiles] = useState(0);
	const [totalDrugs, setTotalDrugs] = useState(0);
	const [totalAreas, setTotalAreas] = useState(0);

	useEffect(() => {
		const loadAnalytics = async () => {
			try {
				setLoading(true);
				const allCases = await getAllCases();
				setTotalCases(allCases.length);

				if (allCases.length === 0) {
					setDrugData([]);
					setAreaData([]);
					setProfileData([]);
					setSeverityData([]);
					setStatusData([]);
					return;
				}

				// Load all case-related data in parallel
				const [
					allDrugsByCase,
					allAreasByCase,
					allProfilesByCase,
					allRelationshipsByCase,
				] = await Promise.all([
					Promise.all(
						allCases.map((singleCase) =>
							getCaseDrugs(singleCase.id),
						),
					),
					Promise.all(
						allCases.map((singleCase) =>
							getCaseAreas(singleCase.id),
						),
					),
					Promise.all(
						allCases.map((singleCase) =>
							getCaseProfiles(singleCase.id),
						),
					),
					Promise.all(
						allCases.map((singleCase) =>
							getCaseRelationships(singleCase.id),
						),
					),
				]);

				// Drug analysis
				const drugCountMap = new Map<string, number>();
				for (const caseDrugs of allDrugsByCase) {
					for (const drug of caseDrugs) {
						const key = drug.drug_name;
						drugCountMap.set(key, (drugCountMap.get(key) ?? 0) + 1);
					}
				}
				setTotalDrugs(drugCountMap.size);

				// Area analysis
				const areaCountMap = new Map<string, number>();
				for (const caseAreas of allAreasByCase) {
					for (const area of caseAreas) {
						areaCountMap.set(
							area,
							(areaCountMap.get(area) ?? 0) + 1,
						);
					}
				}
				setTotalAreas(areaCountMap.size);

				// Profile analysis with case count
				const profileCountMap = new Map<
					number,
					{ name: string; count: number }
				>();
				const profileConnectionMap = new Map<number, number>();

				for (let i = 0; i < allProfilesByCase.length; i++) {
					const caseProfiles = allProfilesByCase[i];
					for (const profile of caseProfiles) {
						const profileId = profile[0];
						const profileName = profile[1];
						if (!profileCountMap.has(profileId)) {
							profileCountMap.set(profileId, {
								name: profileName,
								count: 0,
							});
							profileConnectionMap.set(profileId, 0);
						}
						const existing = profileCountMap.get(profileId)!;
						profileCountMap.set(profileId, {
							...existing,
							count: existing.count + 1,
						});
					}
				}

				// Count connections for each profile (network centrality)
				for (const relationships of allRelationshipsByCase) {
					for (const rel of relationships) {
						const sourceCount =
							(profileConnectionMap.get(rel.source_profile_id) ??
								0) + 1;
						const targetCount =
							(profileConnectionMap.get(rel.target_profile_id) ??
								0) + 1;
						profileConnectionMap.set(
							rel.source_profile_id,
							sourceCount,
						);
						profileConnectionMap.set(
							rel.target_profile_id,
							targetCount,
						);
					}
				}
				setTotalProfiles(profileCountMap.size);

				// Severity and Status distribution
				const severityMap = new Map<string, number>();
				const statusMap = new Map<string, number>();
				for (const caseItem of allCases) {
					if (caseItem.severity_level) {
						severityMap.set(
							caseItem.severity_level,
							(severityMap.get(caseItem.severity_level) ?? 0) + 1,
						);
					}
					if (caseItem.status) {
						statusMap.set(
							caseItem.status,
							(statusMap.get(caseItem.status) ?? 0) + 1,
						);
					}
				}

				// Set drug data
				setDrugData(
					Array.from(drugCountMap.entries())
						.map(([drug, count]) => ({ drug, count }))
						.sort((a, b) => b.count - a.count)
						.slice(0, 10),
				);

				// Set area data
				setAreaData(
					Array.from(areaCountMap.entries())
						.map(([area, count]) => ({ area, count }))
						.sort((a, b) => b.count - a.count)
						.slice(0, 8),
				);

				// Set profile data with connections
				const topProfiles = Array.from(profileCountMap.entries())
					.map(([profileId, { name, count }]) => ({
						name,
						count,
						connections: profileConnectionMap.get(profileId) ?? 0,
					}))
					.sort((a, b) => b.count - a.count)
					.slice(0, 10);
				setProfileData(topProfiles);

				// Set severity data
				const severityOrder = ["Low", "Medium", "High", "Critical"];
				const sortedSeverity = Array.from(severityMap.entries())
					.map(([level, count]) => ({ level, count }))
					.sort(
						(a, b) =>
							severityOrder.indexOf(a.level) -
							severityOrder.indexOf(b.level),
					);
				setSeverityData(sortedSeverity);

				// Set status data
				const sortedStatus = Array.from(statusMap.entries())
					.map(([status, count]) => ({ status, count }))
					.sort((a, b) => b.count - a.count);
				setStatusData(sortedStatus);
			} catch (error) {
				console.error("Failed to load analytics:", error);
				toast.error("Failed to load analytics", {
					position: "top-center",
				});
			} finally {
				setLoading(false);
			}
		};

		loadAnalytics();
	}, []);

	if (loading) {
		return (
			<div className="container mx-auto flex items-center justify-center py-12">
				<p className="text-gray-500">Loading analytics...</p>
			</div>
		);
	}

	return (
		<div className="w-full mx-auto space-y-6">
			{/* Key Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					icon={Activity}
					title="Total Cases"
					value={totalCases}
					color="#3b82f6"
				/>
				<MetricCard
					icon={Users}
					title="Unique Profiles"
					value={totalProfiles}
					color="#8b5cf6"
				/>
				<MetricCard
					icon={Pill}
					title="Drug Types"
					value={totalDrugs}
					color="#ef4444"
				/>
				<MetricCard
					icon={MapPin}
					title="Operational Areas"
					value={totalAreas}
					color="#10b981"
				/>
			</div>

			{/* Tabs for detailed views */}
			<Tabs
				value={activeSection}
				onValueChange={(value) =>
					setActiveSection(
						value as "overview" | "drugs" | "areas" | "profiles",
					)
				}
				className="w-full"
			>
				<TabsList className="flex gap-2">
					<TabsTrigger value="overview" className="cursor-pointer">
						Overview
					</TabsTrigger>
					<TabsTrigger value="drugs" className="cursor-pointer">
						Drugs
					</TabsTrigger>
					<TabsTrigger value="areas" className="cursor-pointer">
						Areas
					</TabsTrigger>
					<TabsTrigger value="profiles" className="cursor-pointer">
						Profiles
					</TabsTrigger>
				</TabsList>

				{/* Overview Tab - Severity and Status */}
				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* Case Severity Distribution */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									Case Severity Distribution
								</CardTitle>
								<CardDescription>
									Cases by severity level
								</CardDescription>
							</CardHeader>
							<CardContent>
								{severityData.length > 0 ? (
									<ChartContainer
										className="h-[300px] w-full"
										config={{
											count: {
												label: "Count",
												color: "#8b5cf6",
											},
										}}
									>
										<BarChart
											accessibilityLayer
											data={severityData}
											margin={{ left: 8, right: 8 }}
										>
											<CartesianGrid vertical={false} />
											<XAxis
												dataKey="level"
												tickLine={false}
												axisLine={false}
											/>
											<ChartTooltip
												cursor={false}
												content={
													<ChartTooltipContent />
												}
											/>
											<Bar dataKey="count" radius={6}>
												{severityData.map((entry) => (
													<Cell
														key={entry.level}
														fill={
															SEVERITY_COLORS[
																entry.level
															] || "#6b7280"
														}
													/>
												))}
											</Bar>
										</BarChart>
									</ChartContainer>
								) : (
									<p className="text-sm text-gray-600">
										No severity data available
									</p>
								)}
							</CardContent>
						</Card>

						{/* Case Status Distribution */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									Case Status Breakdown
								</CardTitle>
								<CardDescription>
									Cases by current status
								</CardDescription>
							</CardHeader>
							<CardContent>
								{statusData.length > 0 ? (
									<ChartContainer
										className="h-[300px] w-full"
										config={{
											count: {
												label: "Count",
												color: "#f59e0b",
											},
										}}
									>
										<PieChart accessibilityLayer>
											<ChartTooltip
												cursor={false}
												content={
													<ChartTooltipContent />
												}
											/>
											<Pie
												data={statusData}
												dataKey="count"
												nameKey="status"
												cx="50%"
												cy="50%"
												outerRadius={100}
											>
												{statusData.map((entry) => (
													<Cell
														key={entry.status}
														fill={
															STATUS_COLORS[
																entry.status
															] || "#6b7280"
														}
													/>
												))}
											</Pie>
										</PieChart>
									</ChartContainer>
								) : (
									<p className="text-sm text-gray-600">
										No status data available
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Drugs Tab */}
				<TabsContent value="drugs">
					<Card>
						<CardHeader>
							<CardTitle>Top 10 Drug Types</CardTitle>
							<CardDescription>
								Most frequently linked drugs across all cases
							</CardDescription>
						</CardHeader>
						<CardContent>
							{drugData.length > 0 ? (
								<ChartContainer
									className="h-[360px] w-full"
									config={{
										count: {
											label: "Count",
											color: "#ef4444",
										},
									}}
								>
									<BarChart
										accessibilityLayer
										data={drugData}
										margin={{ left: 8, right: 8 }}
									>
										<CartesianGrid vertical={false} />
										<XAxis
											dataKey="drug"
											tickLine={false}
											axisLine={false}
											tickMargin={10}
											interval={0}
											tickFormatter={(value) =>
												String(value).length > 12
													? `${String(value).slice(0, 12)}...`
													: String(value)
											}
										/>
										<ChartTooltip
											cursor={false}
											content={<ChartTooltipContent />}
										/>
										<Bar
											dataKey="count"
											radius={6}
											fill="var(--color-count)"
										/>
									</BarChart>
								</ChartContainer>
							) : (
								<p className="text-sm text-gray-600">
									No drug data available
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Areas Tab */}
				<TabsContent value="areas">
					<Card>
						<CardHeader>
							<CardTitle>Top 8 Operational Areas</CardTitle>
							<CardDescription>
								Most frequently linked areas across all cases
							</CardDescription>
						</CardHeader>
						<CardContent>
							{areaData.length > 0 ? (
								<ChartContainer
									className="h-[360px] w-full"
									config={{
										count: {
											label: "Count",
											color: "#10b981",
										},
									}}
								>
									<PieChart accessibilityLayer>
										<ChartTooltip
											cursor={false}
											content={<ChartTooltipContent />}
										/>
										<Pie
											data={areaData}
											dataKey="count"
											nameKey="area"
											innerRadius={60}
											outerRadius={120}
											paddingAngle={2}
										>
											{areaData.map((entry, index) => (
												<Cell
													key={entry.area}
													fill={
														AREA_COLORS[
															index %
																AREA_COLORS.length
														]
													}
												/>
											))}
										</Pie>
									</PieChart>
								</ChartContainer>
							) : (
								<p className="text-sm text-gray-600">
									No area data available
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Profiles Tab */}
				<TabsContent value="profiles">
					<Card>
						<CardHeader>
							<CardTitle>Top 10 Key Profiles</CardTitle>
							<CardDescription>
								Profiles by case involvement and network
								connections
							</CardDescription>
						</CardHeader>
						<CardContent>
							{profileData.length > 0 ? (
								<div className="space-y-4">
									<ChartContainer
										className="h-[360px] w-full"
										config={{
											count: {
												label: "Cases",
												color: "#8b5cf6",
											},
										}}
									>
										<BarChart
											accessibilityLayer
											data={profileData}
											margin={{ left: 8, right: 8 }}
										>
											<CartesianGrid vertical={false} />
											<XAxis
												dataKey="name"
												tickLine={false}
												axisLine={false}
												tickMargin={10}
												interval={0}
												tickFormatter={(value) =>
													String(value).length > 12
														? `${String(value).slice(0, 12)}...`
														: String(value)
												}
											/>
											<ChartTooltip
												cursor={false}
												content={
													<ChartTooltipContent />
												}
											/>
											<Bar
												dataKey="count"
												radius={6}
												fill="var(--color-count)"
											/>
										</BarChart>
									</ChartContainer>

									{/* Profile details table */}
									<div className="mt-6 overflow-x-auto">
										<table className="w-full text-sm">
											<thead className="border-b">
												<tr>
													<th className="text-left py-2 px-2 font-semibold">
														Profile
													</th>
													<th className="text-center py-2 px-2 font-semibold">
														Cases
													</th>
													<th className="text-center py-2 px-2 font-semibold">
														Network Connections
													</th>
												</tr>
											</thead>
											<tbody>
												{profileData.map(
													(profile, idx) => (
														<tr
															key={idx}
															className="border-b hover:bg-gray-50"
														>
															<td className="py-2 px-2">
																{profile.name}
															</td>
															<td className="text-center py-2 px-2 font-semibold text-purple-600">
																{profile.count}
															</td>
															<td className="text-center py-2 px-2">
																<span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
																	{
																		profile.connections
																	}{" "}
																	connections
																</span>
															</td>
														</tr>
													),
												)}
											</tbody>
										</table>
									</div>
								</div>
							) : (
								<p className="text-sm text-gray-600">
									No profile data available
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
