import { Button } from "@/components/ui/button";
import { Users, Network } from "lucide-react";
import { NavLink } from "react-router-dom";

export function Sidebar() {
	return (
		<aside className="w-60 border-r bg-muted/40 p-4 space-y-2">
			<NavLink to="/">
				{({ isActive }) => (
					<Button
						variant={isActive ? "secondary" : "ghost"}
						className="w-full justify-start"
					>
						<Users className="h-4 w-4 mr-2" />
						People
					</Button>
				)}
			</NavLink>

			<NavLink to="/network">
				{({ isActive }) => (
					<Button
						variant={isActive ? "secondary" : "ghost"}
						className="w-full justify-start"
					>
						<Network className="h-4 w-4 mr-2" />
						Network View
					</Button>
				)}
			</NavLink>
		</aside>
	);
}
