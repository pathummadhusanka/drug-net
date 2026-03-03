import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Info, MessageCircleQuestionMark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function Header() {
	const [infoDialogOpen, setInfoDialogOpen] = useState(false);
	const navigate = useNavigate();
	return (
		<header className="h-14 border-b bg-background px-6 flex items-center justify-between">
			{/* Left - App Title */}
			<div className="text-lg font-semibold">DrugNET</div>

			{/* Center - Global Search */}
			<div className="flex-1 max-w-md px-6">
				<div className="relative">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search profiles..." className="pl-8" />
				</div>
			</div>

			{/* Right - Global Actions */}
			<div className="flex items-center gap-2">
				<Button
					variant="secondary"
					size="icon"
					onClick={() => navigate("/help")}
					className="cursor-pointer"
				>
					<MessageCircleQuestionMark className="h-5 w-5" />
				</Button>

				<Button
					variant="secondary"
					size="icon"
					onClick={() => setInfoDialogOpen(true)}
					className="cursor-pointer"
				>
					<Info className="h-5 w-5" />
				</Button>

				<AlertDialog
					open={infoDialogOpen}
					onOpenChange={setInfoDialogOpen}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>About DrugNet</AlertDialogTitle>
							<AlertDialogDescription>
								<div className="space-y-2">
									<p>
										<span className="font-semibold">
											Application Name:
										</span>{" "}
										DrugNet
									</p>
									<p>
										<span className="font-semibold">
											Version:
										</span>{" "}
										1.0.0-alpha.1
									</p>
								</div>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogAction
								onClick={() => setInfoDialogOpen(false)}
								className="cursor-pointer"
							>
								Close
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* <div className="bg-primary text-primary-foreground">
					This should use neutral colors
				</div> */}
			</div>
		</header>
	);
}
