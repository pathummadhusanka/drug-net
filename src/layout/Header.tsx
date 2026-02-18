import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Settings, Database } from "lucide-react";

export function Header() {
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
				<Button variant="secondary" size="sm">
					<Database className="h-4 w-4 mr-2" />
					Backup
				</Button>

				<Button variant="secondary" size="icon">
					<Settings className="h-5 w-5" />
				</Button>

				{/* <div className="bg-primary text-primary-foreground">
					This should use neutral colors
				</div> */}
			</div>
		</header>
	);
}
