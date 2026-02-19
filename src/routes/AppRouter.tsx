import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layout/MainLayout";
import Profiles from "@/pages/Profiles/ProfilesPage";
import Network from "@/pages/Network/NetworkPage";
import ProfileView from "@/pages/ProfileView/ProfileViewPage";
import NewProfile from "@/pages/NewProfile/NewProfilePage";

export function AppRouter() {
	return (
		<Routes>
			<Route element={<MainLayout />}>
				<Route path="/" element={<Profiles />} />
				<Route path="/network" element={<Network />} />
				<Route path="/profile/:id" element={<ProfileView />} />
				<Route path="/new-profile" element={<NewProfile />} />
			</Route>
		</Routes>
	);
}
