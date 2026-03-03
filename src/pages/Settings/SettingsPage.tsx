import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
	getAllDrugs,
	addDrug,
	deleteDrug,
	isDrugInUse,
	type Drug,
} from "@/lib/drugs";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
	const [drugs, setDrugs] = useState<Drug[]>([]);
	const [newDrugName, setNewDrugName] = useState("");
	const [newDrugUnit, setNewDrugUnit] = useState("");
	const [drugInUseStatus, setDrugInUseStatus] = useState<{
		[key: number]: boolean;
	}>({});
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [drugToDelete, setDrugToDelete] = useState<Drug | null>(null);

	useEffect(() => {
		fetchDrugs();
	}, []);

	const fetchDrugs = async () => {
		try {
			const fetchedDrugs = await getAllDrugs();
			setDrugs(fetchedDrugs);

			// Check usage status for each drug
			const statusMap: { [key: number]: boolean } = {};
			for (const drug of fetchedDrugs) {
				const inUse = await isDrugInUse(drug.id);
				statusMap[drug.id] = inUse;
			}
			setDrugInUseStatus(statusMap);
		} catch (error) {
			console.error("Failed to fetch drugs:", error);
			toast.error("Failed to load drugs");
		}
	};

	const handleAddDrug = async () => {
		if (!newDrugName.trim() || !newDrugUnit.trim()) {
			toast.error("Please enter both drug name and unit");
			return;
		}

		try {
			await addDrug(newDrugName.trim(), newDrugUnit.trim());
			toast.success("Drug added successfully");
			setNewDrugName("");
			setNewDrugUnit("");
			fetchDrugs();
		} catch (error) {
			console.error("Failed to add drug:", error);
			toast.error("Failed to add drug");
		}
	};

	const handleDeleteClick = (drug: Drug) => {
		setDrugToDelete(drug);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!drugToDelete) return;

		try {
			await deleteDrug(drugToDelete.id);
			toast.success("Drug deleted successfully");
			setDeleteDialogOpen(false);
			setDrugToDelete(null);
			fetchDrugs();
		} catch (error) {
			console.error("Failed to delete drug:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to delete drug",
			);
		}
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Settings</h1>
				<p className="text-muted-foreground">
					Manage your application settings
				</p>
			</div>

			{/* Drug Management Section */}
			<Card>
				<CardHeader>
					<CardTitle>Drug Management</CardTitle>
					<CardDescription>
						Add or remove drug types and their units of measurement
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Add New Drug Form */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Add New Drug</h3>
						<div className="flex gap-4 items-end">
							<div className="flex-1">
								<Label htmlFor="drugName">Drug Name</Label>
								<Input
									id="drugName"
									placeholder="e.g., Cocaine"
									value={newDrugName}
									onChange={(e) =>
										setNewDrugName(e.target.value)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleAddDrug();
										}
									}}
								/>
							</div>
							<div className="flex-1">
								<Label htmlFor="drugUnit">Quantified By</Label>
								<Input
									id="drugUnit"
									placeholder="e.g., grams, pills, ml"
									value={newDrugUnit}
									onChange={(e) =>
										setNewDrugUnit(e.target.value)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleAddDrug();
										}
									}}
								/>
							</div>
							<Button
								onClick={handleAddDrug}
								className="cursor-pointer"
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Drug
							</Button>
						</div>
					</div>

					{/* Drugs Table */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">
							Existing Drugs
						</h3>
						<div className="border rounded-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Drug Name</TableHead>
										<TableHead>Quantified By</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{drugs.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-center text-muted-foreground"
											>
												No drugs found
											</TableCell>
										</TableRow>
									) : (
										drugs.map((drug) => (
											<TableRow key={drug.id}>
												<TableCell className="font-medium">
													{drug.name}
												</TableCell>
												<TableCell>
													{drug.quantified_by}
												</TableCell>
												<TableCell>
													{drugInUseStatus[
														drug.id
													] ? (
														<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
															In Use
														</span>
													) : (
														<span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
															Not Used
														</span>
													)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															handleDeleteClick(
																drug,
															)
														}
														disabled={
															drugInUseStatus[
																drug.id
															]
														}
														className="cursor-pointer"
														title={
															drugInUseStatus[
																drug.id
															]
																? "Cannot delete drug in use"
																: "Delete drug"
														}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete Drug: {drugToDelete?.name}
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this drug? This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
