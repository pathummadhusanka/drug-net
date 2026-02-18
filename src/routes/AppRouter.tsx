import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layout/MainLayout";
import Profiles from "@/pages/Profiles/ProfilesPage";
import Network from "@/pages/Network/NetworkPage";

export function AppRouter() {
	return (
		<Routes>
			<Route element={<MainLayout />}>
				<Route path="/" element={<Profiles />} />
				<Route path="/network" element={<Network />} />
			</Route>
		</Routes>
	);
}
