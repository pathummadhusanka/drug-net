import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

export function FileCaseModal() {
	const [caseName, setCaseName] = useState("");
	const [caseId, setCaseId] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const id = await invoke<number>("create_case", {
				case: {
					case_name: caseName,
					case_id: caseId || null,
				},
			});

			console.log("Case created with ID:", id);

			// Clear fields and close modal
			setCaseName("");
			setCaseId("");
			setIsOpen(false);
		} catch (err) {
			console.error("Failed to create case:", err);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<div className="flex flex-row items-center gap-4">
					<Button
						variant="secondary"
						className="cursor-pointer"
						type="button"
					>
						<Plus className="h-4 w-4 mr-2" />
						File Case
					</Button>
				</div>
			</DialogTrigger>
			<DialogContent className="max-w-155">
				<form onSubmit={handleSubmit}>
					<DialogHeader className="pb-2">
						<DialogTitle>File Case</DialogTitle>
						<DialogDescription>
							Enter case details below. Fields marked with * are
							required. A unique case number (CNO) will be
							auto-generated.
						</DialogDescription>
					</DialogHeader>
					<FieldGroup>
						<Field>
							<Label htmlFor="case-name">Case Name *</Label>
							<Input
								id="case-name"
								name="name"
								placeholder="Enter case name"
								value={caseName}
								onChange={(e) => setCaseName(e.target.value)}
								required
							/>
						</Field>
						<Field>
							<Label htmlFor="case-number">Case ID</Label>
							<Input
								id="case-number"
								name="caseNumber"
								placeholder="Optional user-defined ID"
								value={caseId}
								onChange={(e) => setCaseId(e.target.value)}
							/>
						</Field>
					</FieldGroup>

					<DialogFooter className="pt-6">
						<DialogClose asChild>
							<Button
								variant="outline"
								type="button"
								className="cursor-pointer"
							>
								Cancel
							</Button>
						</DialogClose>
						<Button type="submit" className="cursor-pointer">
							Save Case
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
