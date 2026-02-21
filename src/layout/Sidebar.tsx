import { Button } from "@/components/ui/button";
import { Users, Network, Library } from "lucide-react";
import { NavLink } from "react-router-dom";

export function Sidebar() {
	return (
		<aside className="w-60 border-r bg-muted/40 p-4 space-y-2">
			<NavLink to="/">
				{({ isActive }) => (
					<Button
						variant={isActive ? "secondary" : "ghost"}
						className="w-full justify-start cursor-pointer"
					>
						<Users className="h-4 w-4 mr-2" />
						Profiles
					</Button>
				)}
			</NavLink>

			<NavLink to="/network">
				{({ isActive }) => (
					<Button
						variant={isActive ? "secondary" : "ghost"}
						className="w-full justify-start cursor-pointer"
					>
						<Network className="h-4 w-4 mr-2" />
						Network
					</Button>
				)}
			</NavLink>

			<NavLink to="/cases">
				{({ isActive }) => (
					<Button
						variant={isActive ? "secondary" : "ghost"}
						className="w-full justify-start cursor-pointer"
					>
						<Library className="h-4 w-4 mr-2" />
						Cases
					</Button>
				)}
			</NavLink>
		</aside>
	);
}
