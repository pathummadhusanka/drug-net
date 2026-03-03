import { useEffect, useMemo, useState } from "react";
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
import { getAllCases, getCaseAreas, getCaseProfiles } from "@/lib/cases";
import { getCaseDrugs } from "@/lib/drugs";
import { toast } from "sonner";

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
};

const AREA_COLORS = [
	"#ef4444",
	"#f87171",
	"#dc2626",
	"#b91c1c",
	"#fca5a5",
	"#fecaca",
];

export default function AnalyticsPage() {
	const [activeSection, setActiveSection] = useState<
		"drugs" | "areas" | "profiles"
	>("drugs");
	const [loading, setLoading] = useState(true);
	const [drugData, setDrugData] = useState<DrugDatum[]>([]);
	const [areaData, setAreaData] = useState<AreaDatum[]>([]);
	const [profileData, setProfileData] = useState<ProfileDatum[]>([]);

	useEffect(() => {
		const loadAnalytics = async () => {
			try {
				setLoading(true);
				const allCases = await getAllCases();

				if (allCases.length === 0) {
					setDrugData([]);
					setAreaData([]);
					setProfileData([]);
					return;
				}

				const [allDrugsByCase, allAreasByCase, allProfilesByCase] =
					await Promise.all([
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
					]);

				const drugCountMap = new Map<string, number>();
				for (const caseDrugs of allDrugsByCase) {
					for (const drug of caseDrugs) {
						const key = drug.drug_name;
						drugCountMap.set(key, (drugCountMap.get(key) ?? 0) + 1);
					}
				}

				const areaCountMap = new Map<string, number>();
				for (const caseAreas of allAreasByCase) {
					for (const area of caseAreas) {
						areaCountMap.set(
							area,
							(areaCountMap.get(area) ?? 0) + 1,
						);
					}
				}

				const profileCountMap = new Map<string, number>();
				for (const caseProfiles of allProfilesByCase) {
					for (const profile of caseProfiles) {
						const key = profile[1]; // profile is [id, name] tuple
						profileCountMap.set(
							key,
							(profileCountMap.get(key) ?? 0) + 1,
						);
					}
				}

				setDrugData(
					Array.from(drugCountMap.entries())
						.map(([drug, count]) => ({ drug, count }))
						.sort((a, b) => b.count - a.count)
						.slice(0, 10),
				);

				setAreaData(
					Array.from(areaCountMap.entries())
						.map(([area, count]) => ({ area, count }))
						.sort((a, b) => b.count - a.count)
						.slice(0, 8),
				);

				setProfileData(
					Array.from(profileCountMap.entries())
						.map(([name, count]) => ({ name, count }))
						.sort((a, b) => b.count - a.count)
						.slice(0, 10),
				);
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

	const summary = useMemo(
		() => ({
			drugItems: drugData.length,
			areaItems: areaData.length,
			profileItems: profileData.length,
			totalDrugMentions: drugData.reduce(
				(sum, item) => sum + item.count,
				0,
			),
			totalAreaMentions: areaData.reduce(
				(sum, item) => sum + item.count,
				0,
			),
			totalProfileMentions: profileData.reduce(
				(sum, item) => sum + item.count,
				0,
			),
		}),
		[drugData, areaData, profileData],
	);

	if (loading) {
		return (
			<div className="container mx-auto flex items-center justify-center py-12">
				<p className="text-gray-500">Loading analytics...</p>
			</div>
		);
	}

	return (
		<div className="w-full mx-auto space-y-4">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold text-gray-700">
						Analytics
					</h3>
					<div className="text-xs text-gray-500">
						{summary.totalDrugMentions} drug mentions •{" "}
						{summary.totalAreaMentions} area mentions •{" "}
						{summary.totalProfileMentions} profile mentions
					</div>
				</div>

				<Tabs
					value={activeSection}
					onValueChange={(value) =>
						setActiveSection(
							value as "drugs" | "areas" | "profiles",
						)
					}
					className="w-full"
				>
					<TabsList className="flex gap-4">
						<TabsTrigger value="drugs" className="cursor-pointer">
							Drugs
						</TabsTrigger>
						<TabsTrigger value="areas" className="cursor-pointer">
							Areas
						</TabsTrigger>
						<TabsTrigger
							value="profiles"
							className="cursor-pointer"
						>
							Profiles
						</TabsTrigger>
					</TabsList>

					<TabsContent value="drugs">
						<Card>
							<CardHeader>
								<CardTitle>Top Drugs</CardTitle>
								<CardDescription>
									Most frequently linked drugs across all
									cases
								</CardDescription>
							</CardHeader>
							<CardContent>
								{summary.drugItems > 0 ? (
									<ChartContainer
										className="h-[360px] w-full"
										config={{
											count: {
												label: "Count",
												color: "#3b82f6",
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
								) : (
									<p className="text-sm text-gray-600">
										No drug data available
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="areas">
						<Card>
							<CardHeader>
								<CardTitle>Top Areas</CardTitle>
								<CardDescription>
									Most frequently linked areas across all
									cases
								</CardDescription>
							</CardHeader>
							<CardContent>
								{summary.areaItems > 0 ? (
									<ChartContainer
										className="h-[360px] w-full"
										config={{
											count: {
												label: "Count",
												color: "#ef4444",
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
												data={areaData}
												dataKey="count"
												nameKey="area"
												innerRadius={60}
												outerRadius={120}
												paddingAngle={2}
											>
												{areaData.map(
													(entry, index) => (
														<Cell
															key={entry.area}
															fill={
																AREA_COLORS[
																	index %
																		AREA_COLORS.length
																]
															}
														/>
													),
												)}
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

					<TabsContent value="profiles">
						<Card>
							<CardHeader>
								<CardTitle>Top Profiles</CardTitle>
								<CardDescription>
									Profiles most frequently involved in cases
								</CardDescription>
							</CardHeader>
							<CardContent>
								{summary.profileItems > 0 ? (
									<ChartContainer
										className="h-[360px] w-full"
										config={{
											count: {
												label: "Count",
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
		</div>
	);
}
