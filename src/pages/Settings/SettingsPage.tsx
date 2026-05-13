import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarTrigger,
} from "@/components/ui/menubar";
import { Trash2, CirclePlus, Database } from "lucide-react";
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
import {
	COMMON_APP_TIMEZONES,
	getAppTimeZone,
	getSystemTimeZone,
	isValidTimeZone,
	setAppTimeZone,
} from "@/lib/datetime";

export default function SettingsPage() {
	const [drugs, setDrugs] = useState<Drug[]>([]);
	const [newDrugName, setNewDrugName] = useState("");
	const [newDrugUnit, setNewDrugUnit] = useState("");
	const [drugInUseStatus, setDrugInUseStatus] = useState<{
		[key: number]: boolean;
	}>({});
	const [addDrugDialogOpen, setAddDrugDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [drugToDelete, setDrugToDelete] = useState<Drug | null>(null);
	const [activeSection, setActiveSection] = useState<
		"general" | "drugs" | "dangerZone"
	>("general");
	const [timeZoneInput, setTimeZoneInput] = useState("");
	const [savedTimeZone, setSavedTimeZone] = useState("");
	const [resetDbDialogOpen, setResetDbDialogOpen] = useState(false);
	const [resetConfirmationText, setResetConfirmationText] = useState("");

	useEffect(() => {
		fetchDrugs();
		const currentTimeZone = getAppTimeZone();
		setTimeZoneInput(currentTimeZone);
		setSavedTimeZone(currentTimeZone);
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
			setAddDrugDialogOpen(false);
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

	const handleResetDatabase = async () => {
		if (resetConfirmationText !== "deleteDB") {
			toast.error("Please type 'deleteDB' to confirm");
			return;
		}

		try {
			await invoke("reset_database");
			toast.success("Database reset successfully");
			setResetDbDialogOpen(false);
			setResetConfirmationText("");
			// Refresh drugs list after reset
			fetchDrugs();
		} catch (error) {
			console.error("Failed to reset database:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to reset database",
			);
		}
	};

	const handleSaveTimeZone = () => {
		const trimmed = timeZoneInput.trim();
		if (!trimmed || !isValidTimeZone(trimmed)) {
			toast.error("Please enter a valid IANA timezone");
			return;
		}

		if (!setAppTimeZone(trimmed)) {
			toast.error("Failed to save timezone");
			return;
		}

		setSavedTimeZone(trimmed);
		toast.success(`Timezone updated to ${trimmed}`);
	};

	const handleUseSystemTimeZone = () => {
		const systemTimeZone = getSystemTimeZone();
		setTimeZoneInput(systemTimeZone);

		if (!setAppTimeZone(systemTimeZone)) {
			toast.error("Failed to save timezone");
			return;
		}

		setSavedTimeZone(systemTimeZone);
		toast.success(`Timezone reset to system default (${systemTimeZone})`);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold">Settings</h1>
					<p className="text-muted-foreground">
						Manage your application settings
					</p>
				</div>

				{/* Settings Menu */}
				<Menubar className="w-full bg-muted/40 border">
					<MenubarMenu>
						<MenubarTrigger
							className={`cursor-pointer ${
								activeSection === "general" ||
								activeSection === "drugs"
									? "bg-secondary"
									: ""
							}`}
						>
							Customize
						</MenubarTrigger>
						<MenubarContent>
							<MenubarItem
								onClick={() => setActiveSection("general")}
								className="cursor-pointer"
							>
								Time and Region
							</MenubarItem>
							<MenubarItem
								onClick={() => setActiveSection("drugs")}
								className="cursor-pointer"
							>
								Edit Drugs
							</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger
							className={`cursor-pointer ${
								activeSection === "dangerZone"
									? "bg-secondary"
									: ""
							}`}
						>
							System
						</MenubarTrigger>
						<MenubarContent>
							<MenubarItem
								onClick={() => setActiveSection("dangerZone")}
								className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
							>
								Danger Zone
							</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</div>

			{/* Timezone Section */}
			{activeSection === "general" && (
				<div className="space-y-6">
					<div>
						<h2 className="text-2xl font-bold">Time and Region</h2>
						<p className="text-muted-foreground">
							Choose the timezone used to render all audit
							timestamps (created and updated times).
						</p>
					</div>

					<div className="border rounded-lg p-4 space-y-4">
						<div className="space-y-2">
							<Label htmlFor="app-timezone">App Timezone</Label>
							<Input
								id="app-timezone"
								list="app-timezone-options"
								placeholder="e.g., Asia/Colombo"
								value={timeZoneInput}
								onChange={(e) =>
									setTimeZoneInput(e.target.value)
								}
							/>
							<datalist id="app-timezone-options">
								{COMMON_APP_TIMEZONES.map((timezone) => (
									<option key={timezone} value={timezone} />
								))}
							</datalist>
						</div>

						<p className="text-xs text-muted-foreground">
							Saved timezone: {savedTimeZone || "Not set"}
						</p>
						<p className="text-xs text-muted-foreground">
							System timezone: {getSystemTimeZone()}
						</p>

						<div className="flex items-center gap-2">
							<Button
								onClick={handleSaveTimeZone}
								className="cursor-pointer"
							>
								Save Timezone
							</Button>
							<Button
								variant="outline"
								onClick={handleUseSystemTimeZone}
								className="cursor-pointer"
							>
								Use System Timezone
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Drug Management Section */}
			{activeSection === "drugs" && (
				<div className="space-y-6">
					<div className="flex flex-row items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold">
								Drug Management
							</h2>
							<p className="text-muted-foreground">
								Add or remove drug types and their units of
								measurement
							</p>
						</div>
						<Button
							onClick={() => setAddDrugDialogOpen(true)}
							className="cursor-pointer"
						>
							<CirclePlus className="h-4 w-4 mr-2" />
							New Drug
						</Button>
					</div>
					{/* Drugs Table */}
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
												{drugInUseStatus[drug.id] ? (
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
														handleDeleteClick(drug)
													}
													disabled={
														drugInUseStatus[drug.id]
													}
													className="cursor-pointer"
													title={
														drugInUseStatus[drug.id]
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
			)}

			{/* Danger Zone Section */}
			{activeSection === "dangerZone" && (
				<div className="space-y-6">
					<div>
						<h2 className="text-2xl font-bold text-red-600">
							Danger Zone
						</h2>
						<p className="text-muted-foreground mt-2">
							Irreversible and destructive actions
						</p>
					</div>

					<div className="border rounded-lg p-4">
						<div className="flex flex-row items-center justify-between">
							<div className="space-y-1">
								<h3 className="font-semibold text-red-700">
									Reset Database
								</h3>
								<p className="text-sm text-muted-foreground">
									Delete all user data and reset the database
									to a fresh state. This will remove all
									profiles, cases, relationships, and custom
									drugs.
								</p>
							</div>
							<Button
								variant="destructive"
								onClick={() => setResetDbDialogOpen(true)}
								className="cursor-pointer ml-4"
							>
								<Database className="h-4 w-4 mr-2" />
								Reset Database
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Add Drug Modal */}
			<Dialog
				open={addDrugDialogOpen}
				onOpenChange={setAddDrugDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Drug</DialogTitle>
						<DialogDescription>
							Enter the drug name and its unit of measurement
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="drugName">Drug Name</Label>
							<Input
								id="drugName"
								placeholder="e.g., Cocaine"
								value={newDrugName}
								onChange={(e) => setNewDrugName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleAddDrug();
									}
								}}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="drugUnit">Quantified By</Label>
							<Input
								id="drugUnit"
								placeholder="e.g., grams, pills, ml"
								value={newDrugUnit}
								onChange={(e) => setNewDrugUnit(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleAddDrug();
									}
								}}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setAddDrugDialogOpen(false)}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							onClick={handleAddDrug}
							className="cursor-pointer"
						>
							<CirclePlus className="h-4 w-4 mr-2" />
							Add Drug
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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

			{/* Reset Database Confirmation Dialog */}
			<AlertDialog
				open={resetDbDialogOpen}
				onOpenChange={(open) => {
					setResetDbDialogOpen(open);
					if (!open) {
						setResetConfirmationText("");
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-red-600">
							Reset Database to Factory Defaults?
						</AlertDialogTitle>
						<AlertDialogDescription>
							<span className="font-semibold text-red-600">
								WARNING: This action is irreversible!
							</span>
							<br />
							<br />
							All the following data will be permanently deleted:
							<ul className="list-disc list-inside mt-2 space-y-1">
								<li>All profiles and their information</li>
								<li>All cases and associated data</li>
								<li>All relationships and connections</li>
								<li>
									All custom drugs (system default drugs will
									remain)
								</li>
							</ul>
							<br />
							The database will be reset to a clean state as if
							the application was just installed.
							<br />
							<br />
							<div className="mt-4">
								<Label
									htmlFor="confirmText"
									className="text-sm font-semibold"
								>
									Please type{" "}
									<span className="font-mono bg-muted px-1 rounded">
										deleteDB
									</span>{" "}
									to confirm:
								</Label>
								<Input
									id="confirmText"
									value={resetConfirmationText}
									onChange={(e) =>
										setResetConfirmationText(e.target.value)
									}
									placeholder="Type deleteDB here"
									className="mt-2"
									autoComplete="off"
								/>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleResetDatabase}
							disabled={resetConfirmationText !== "deleteDB"}
							className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Reset Database
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
