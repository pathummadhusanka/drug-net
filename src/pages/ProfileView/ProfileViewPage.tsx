import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, MoreVertical, X, Check } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardHeader,
// 	CardTitle,
// } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
	const [activeAccordion, setActiveAccordion] = useState("case-details");
	const [completedSections, setCompletedSections] = useState<string[]>([]);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize textarea based on content
	const handleTextareaResize = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	};

	useEffect(() => {
		handleTextareaResize();
	}, [caseNotes]);

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
																	(2/4)
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
														<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 px-2">
															<div className="space-y-2">
																<Label htmlFor="case-name">
																	Case Name *
																</Label>
																<Input
																	id="case-name"
																	name="name"
																	placeholder="Enter case name"
																	required
																/>
															</div>
															<div className="space-y-2">
																<Label htmlFor="case-number">
																	Case Number
																</Label>
																<Input
																	id="case-number"
																	name="caseNumber"
																	placeholder="Optional"
																/>
															</div>
															<div className="space-y-2">
																<Label htmlFor="case-description">
																	Description
																</Label>
																<Input
																	id="case-description"
																	name="description"
																	placeholder="Enter case description"
																/>
															</div>
															<div className="space-y-2">
																<Label htmlFor="case-date">
																	Date
																</Label>
																<Input
																	id="case-date"
																	name="date"
																	type="date"
																/>
															</div>
														</div>
													</AccordionContent>
												</AccordionItem>
												<AccordionItem
													value="suspects"
													className={
														activeAccordion ===
														"suspects"
															? "border-l-4 border-blue-500 bg-blue-50/50"
															: ""
													}
												>
													<AccordionTrigger className="cursor-pointer hover:bg-gray-50 transition-colors px-2">
														<div className="flex justify-between items-center w-full mr-2">
															<div className="flex items-center gap-2">
																{completedSections.includes(
																	"suspects",
																) && (
																	<Check className="h-4 w-4 text-green-600" />
																)}
																<span>
																	[2] Suspects
																</span>
																<span className="text-xs text-gray-400 ml-2">
																	(0/3)
																</span>
															</div>
															<span className="text-gray-500 text-sm text-right">
																Add information
																about suspects
																involved
															</span>
														</div>
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-4 pt-2 px-2">
															<p className="text-sm text-gray-500">
																Add suspect
																information here
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
															<p className="text-sm text-gray-500">
																Add drug details
																here
															</p>
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
															<p className="text-sm text-gray-500">
																Add area
																information here
															</p>
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
														<div className="space-y-2 pt-2 px-2">
															<Label htmlFor="case-notes">
																Notes
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
																	handleTextareaResize();
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
