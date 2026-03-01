import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { invoke } from "@tauri-apps/api/core";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function NewProfile() {
	const navigate = useNavigate();

	const [fullName, setFullName] = useState("");
	const [alias, setAlias] = useState("");
	const [nic, setNic] = useState("");
	const [addressLine1, setAddressLine1] = useState("");
	const [addressLine2, setAddressLine2] = useState("");
	const [city, setCity] = useState("");
	const [notes, setNotes] = useState("");
	const [riskLevel, setRiskLevel] = useState<string | null>(null);
	const [status, setStatus] = useState<string | null>(null);
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
	}, [notes]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// const address = [addressLine1, addressLine2, city]
		// 	.filter(Boolean)
		// 	.join(", ");

		try {
			const id = await invoke<number>("create_profile", {
				profile: {
					full_name: fullName,
					alias: alias || null,
					nic: nic || null,
					address_line1: addressLine1 || null,
					address_line2: addressLine2 || null,
					city: city || null,
					risk_level: riskLevel,
					status: status,
					notes: notes || null,
				},
			});

			console.log("Inserted profile ID:", id);
			navigate(`/profile/${id}`);
		} catch (err) {
			console.error("Insert failed:", err);
		}
	};

	function clearFields() {
		{
			setFullName("");
			setAlias("");
			setNic("");
			setAddressLine1("");
			setAddressLine2("");
			setCity("");
			setNotes("");
			setRiskLevel(null);
			setStatus(null);
		}
	}

	return (
		<>
			<div className="w-full mx-auto space-y-1">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">
						Create New Profile
					</h2>
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
					Complete the following steps to create a new profile.
				</p>{" "}
				<Separator className="mt-2 mb-10" />{" "}
				<form onSubmit={handleSubmit}>
					<div className="max-w-170 mx-auto">
						<div className=" w-full flex flex-col gap-6">
							<div className="grid gap-2">
								<Label htmlFor="fullName">Full Name</Label>
								<Input
									id="fullName"
									type="text"
									placeholder="John Doe"
									required
									value={fullName}
									onChange={(e) =>
										setFullName(e.target.value)
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="nic">NIC</Label>
								<Input
									id="nic"
									type="text"
									placeholder="Optional (must be unique)"
									value={nic}
									onChange={(e) => setNic(e.target.value)}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="alias">Alias</Label>
								<Input
									id="alias"
									type="text"
									placeholder="Optional"
									value={alias}
									onChange={(e) => setAlias(e.target.value)}
								/>
							</div>

							<div className="mt-2">
								<div className="grid gap-2">
									<Label htmlFor="addressLine1">
										Address Line 1
									</Label>
									<Input
										id="addressLine1"
										type="text"
										placeholder="Optional"
										value={addressLine1}
										onChange={(e) =>
											setAddressLine1(e.target.value)
										}
									/>
								</div>
								<div className="grid gap-2 mt-6">
									<Label htmlFor="addressLine2">
										Address Line 2
									</Label>
									<Input
										id="addressLine2"
										type="text"
										placeholder="Optional"
										value={addressLine2}
										onChange={(e) =>
											setAddressLine2(e.target.value)
										}
									/>
								</div>
								<div className="grid gap-2 mt-6">
									<Label htmlFor="city">City</Label>
									<Input
										id="city"
										type="text"
										placeholder="Optional"
										value={city}
										onChange={(e) =>
											setCity(e.target.value)
										}
									/>
								</div>
							</div>

							<div className="mt-6">
								<Label className="text-base font-semibold mb-4 block">
									Risk Level
								</Label>
								<div className="flex gap-3">
									{["Low", "Medium", "High"].map((level) => (
										<button
											key={level}
											type="button"
											onClick={() =>
												setRiskLevel(
													riskLevel === level
														? null
														: level,
												)
											}
											className="flex items-center gap-2 relative"
										>
											<Badge
												variant={
													riskLevel === level
														? level === "Low"
															? "default"
															: level === "Medium"
																? "secondary"
																: "destructive"
														: "outline"
												}
												className="px-3 py-1 cursor-pointer transition-all"
											>
												{level}
											</Badge>
											{riskLevel === level && (
												<Check className="absolute -top-1 -right-1 h-4 w-4 bg-white rounded-full" />
											)}
										</button>
									))}
								</div>
							</div>

							<div className="mt-6">
								<Label className="text-base font-semibold mb-4 block">
									Status
								</Label>
								<FieldGroup className="max-w-sm">
									{["Active", "Inactive", "Suspended"].map(
										(statusOption) => (
											<Field
												key={statusOption}
												orientation="horizontal"
											>
												<Checkbox
													id={`status-${statusOption}`}
													name={`status-${statusOption}`}
													checked={
														status === statusOption
													}
													onCheckedChange={(
														checked,
													) => {
														if (checked) {
															setStatus(
																statusOption,
															);
														} else if (
															status ===
															statusOption
														) {
															setStatus(null);
														}
													}}
												/>
												<FieldLabel
													htmlFor={`status-${statusOption}`}
													className="cursor-pointer"
												>
													{statusOption}
												</FieldLabel>
											</Field>
										),
									)}
								</FieldGroup>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="notes">Notes</Label>
								<Textarea
									ref={textareaRef}
									maxLength={500}
									id="notes"
									placeholder="Include notes"
									value={notes}
									onChange={(e) => {
										setNotes(e.target.value);
										handleTextareaResize();
									}}
									className="resize-none overflow-hidden"
								/>
								<div className="text-sm text-gray-500">
									{notes.length}/500
								</div>
							</div>

							<div className="flex justify-between mt-6 pb-10 gap-2">
								<Button
									type="button"
									variant="outline"
									className="cursor-pointer"
									onClick={clearFields}
								>
									Clear
								</Button>

								<div className="flex gap-2">
									<Button
										type="submit"
										variant="default"
										className="cursor-pointer"
									>
										Save Profile
									</Button>
									<Button
										type="button"
										variant="default"
										className="cursor-pointer"
									>
										Save & File Cases
									</Button>
								</div>
							</div>
						</div>
					</div>
				</form>
			</div>
		</>
	);
}
