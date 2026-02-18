import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layout/MainLayout";
import Profiles from "@/pages/Profiles";
import Network from "@/pages/Network";

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
