import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from "@/components/ui/field";
import { FileCaseModal } from "./FileCaseModal";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function NewProfile() {
	const navigate = useNavigate();

	const [fullName, setFullName] = useState("");
	const [alias, setAlias] = useState("");
	const [nic, setNic] = useState("");
	const [addressLine1, setAddressLine1] = useState("");
	const [addressLine2, setAddressLine2] = useState("");
	const [city, setCity] = useState("");
	const [notes, setNotes] = useState("");

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
					risk_level: null,
					status: null,
					notes: notes || null,
				},
			});

			console.log("Inserted profile ID:", id);
			navigate(`/profiles/${id}`);
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
		}
	}

	return (
		<>
			<div className="flex items-center justify-between mb-4">
				<Button
					onClick={() => navigate(-1)}
					variant="outline"
					className="cursor-pointer"
				>
					<ChevronLeft className="h-4 w-4 mr-2" />
					All Profiles
				</Button>
			</div>

			<div className="max-w-[680px] mx-auto">
				<form onSubmit={handleSubmit}>
					<div className="flex flex-col gap-6">
						<span className="text-lg font-medium whitespace-nowrap">
							Create New Profile
						</span>
						{/* <Separator /> */}

						<div className="grid gap-2">
							<Label htmlFor="fullName">Full Name</Label>
							<Input
								id="fullName"
								type="text"
								placeholder="John Doe"
								required
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
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
									onChange={(e) => setCity(e.target.value)}
								/>
							</div>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="notes">Notes</Label>
							<Textarea
								maxLength={500}
								id="notes"
								placeholder="Include notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
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
				</form>
			</div>
		</>
	);
}
