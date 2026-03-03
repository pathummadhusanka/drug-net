import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layout/MainLayout";
import Profiles from "@/pages/Profiles/ProfilesPage";
import Network from "@/pages/Network/NetworkPage";
import ProfileView from "@/pages/ProfileView/ProfileViewPage";
import NewProfile from "@/pages/NewProfile/NewProfilePage";
import Cases from "@/pages/Cases/CasesPage";
import NewCasePage from "@/pages/NewCase/NewCasePage";
import SettingsPage from "@/pages/Settings/SettingsPage";
import HelpPage from "@/pages/Help/HelpPage";
export function AppRouter() {
	return (
		<Routes>
			<Route element={<MainLayout />}>
				<Route path="/" element={<Profiles />} />
				<Route path="/network" element={<Network />} />
				<Route path="/profile/:id" element={<ProfileView />} />
				<Route path="/new-profile" element={<NewProfile />} />
				<Route path="/cases" element={<Cases />} />
				<Route path="/new-case" element={<NewCasePage />} />
				<Route path="/new-case/:id" element={<NewCasePage />} />
				<Route path="/settings" element={<SettingsPage />} />
				<Route path="/help" element={<HelpPage />} />
			</Route>
		</Routes>
	);
}
