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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

export function FileCaseModal() {
	return (
		<Dialog>
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
			<DialogContent className="max-w-[620px]">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						// Handle form submission here
						console.log("Form submitted");
					}}
				>
					<DialogHeader className="pb-2">
						<DialogTitle>File Case</DialogTitle>
						<DialogDescription>
							Enter case details below. Fields marked with * are
							required.
						</DialogDescription>
					</DialogHeader>
					<FieldGroup>
						<Field>
							<Label htmlFor="case-name">Case Name *</Label>
							<Input
								id="case-name"
								name="name"
								placeholder="Enter case name"
								required
							/>
						</Field>
						<Field>
							<Label htmlFor="case-number">Case Number</Label>
							<Input
								id="case-number"
								name="caseNumber"
								placeholder="Optional"
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
