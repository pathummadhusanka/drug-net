import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";

export function MainLayout() {
	return (
		<div className="h-screen flex flex-col">
			{/* Header */}
			<Header />

			{/* Body */}
			<div className="flex flex-1 overflow-hidden">
				<Sidebar />

				<main className="flex-1 p-6 overflow-auto">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
