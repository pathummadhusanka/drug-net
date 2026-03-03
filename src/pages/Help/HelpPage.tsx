import { useState } from "react";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarTrigger,
} from "@/components/ui/menubar";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpPage() {
	const [activeSection, setActiveSection] =
		useState<"drug-guide">("drug-guide");

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="space-y-4">
				<h1 className="text-3xl font-bold">Help</h1>
				<p className="text-muted-foreground">
					Application support information
				</p>

				<Menubar className="w-full bg-muted/40 border">
					<MenubarMenu>
						<MenubarTrigger
							className={`cursor-pointer ${
								activeSection === "drug-guide"
									? "bg-secondary"
									: ""
							}`}
						>
							Help Topics
						</MenubarTrigger>
						<MenubarContent>
							<MenubarItem
								onClick={() => setActiveSection("drug-guide")}
								className="cursor-pointer"
							>
								Add Drug Guide
							</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</div>

			{activeSection === "drug-guide" && (
				<div className="space-y-4 text-sm">
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="add-drug-guide">
							<AccordionTrigger className="cursor-pointer">
								1.1 Add a Drug to the Database
							</AccordionTrigger>
							<AccordionContent>
								<p className="text-muted-foreground mb-3">
									Follow these steps to add a new drug type so
									it appears in the case filing combobox.
								</p>
								<ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
									<li>
										Open{" "}
										<span className="font-medium text-foreground">
											Settings
										</span>{" "}
										from the sidebar.
									</li>
									<li>
										In the settings menu, select{" "}
										<span className="font-medium text-foreground">
											Drugs
										</span>
										.
									</li>
									<li>
										Click{" "}
										<span className="font-medium text-foreground">
											New Drug
										</span>
										.
									</li>
									<li>
										Enter the{" "}
										<span className="font-medium text-foreground">
											Drug Name
										</span>{" "}
										(example: Ketamine).
									</li>
									<li>
										Enter{" "}
										<span className="font-medium text-foreground">
											Quantified By
										</span>{" "}
										(example: grams, pills, ml).
									</li>
									<li>
										Click{" "}
										<span className="font-medium text-foreground">
											Add Drug
										</span>{" "}
										to save it to the database.
									</li>
									<li>
										Go to{" "}
										<span className="font-medium text-foreground">
											File Case
										</span>{" "}
										and you can now select that drug in the
										combobox.
									</li>
								</ol>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="delete-drug-guide">
							<AccordionTrigger className="cursor-pointer">
								1.2 Delete a Drug Safely
							</AccordionTrigger>
							<AccordionContent>
								<p className="text-muted-foreground mb-3">
									Use this flow to remove a drug only when it
									is not used by existing cases.
								</p>
								<ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
									<li>
										Open{" "}
										<span className="font-medium text-foreground">
											Settings
										</span>{" "}
										and go to{" "}
										<span className="font-medium text-foreground">
											Drugs
										</span>
										.
									</li>
									<li>
										Find the drug in the table and check the{" "}
										<span className="font-medium text-foreground">
											Status
										</span>{" "}
										column.
									</li>
									<li>
										If status is{" "}
										<span className="font-medium text-foreground">
											In Use
										</span>
										, deletion is disabled.
									</li>
									<li>
										If status is{" "}
										<span className="font-medium text-foreground">
											Not Used
										</span>
										, click the delete icon.
									</li>
									<li>
										Confirm the delete action in the dialog.
									</li>
								</ol>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			)}
		</div>
	);
}
