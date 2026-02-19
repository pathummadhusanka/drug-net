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

export default function NewProfile() {
	const navigate = useNavigate();

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
				<form>
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
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="nic">NIC</Label>
							<Input
								id="nic"
								type="text"
								placeholder="Optional (must be unique)"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="alias">Alias</Label>
							<Input
								id="alias"
								type="text"
								placeholder="Optional"
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
								/>
							</div>
							<div className="grid gap-2 mt-6">
								<Label htmlFor="city">City</Label>
								<Input
									id="city"
									type="text"
									placeholder="Optional"
								/>
							</div>
						</div>

						<div className="flex justify-between mt-6 pb-10 gap-2">
							<Button
								type="button"
								variant="outline"
								className="cursor-pointer"
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
