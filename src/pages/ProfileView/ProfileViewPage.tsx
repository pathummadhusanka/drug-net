import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, MoreVertical } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardHeader,
// 	CardTitle,
// } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Profile {
	id: number;
	full_name: string;
	alias: string | null;
	nic: string | null;
	address_line1: string | null;
	address_line2: string | null;
	city: string | null;
	risk_level: string | null;
	status: string | null;
	notes: string | null;
	created_at: string | null;
}

export default function ProfileView() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchProfile = async () => {
			if (!id) {
				setError("No profile ID provided");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const result = await invoke<Profile | null>("get_profile", {
					id: parseInt(id),
				});

				if (result) {
					setProfile(result);
					setError(null);
				} else {
					setError("No user found");
					setProfile(null);
				}
			} catch (err) {
				console.error("Failed to fetch profile:", err);
				setError("Failed to load profile");
				setProfile(null);
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, [id]);

	return (
		<>
			<Button
				onClick={() => navigate(-1)}
				variant="outline"
				className="mb-4 cursor-pointer"
			>
				<ChevronLeft className="h-4 w-4 mr-2" />
				All Profiles
			</Button>

			<div className="w-full mx-auto px-6">
				{loading && (
					<div className="text-center py-8">
						<p className="text-gray-500">Loading profile...</p>
					</div>
				)}

				{error && (
					<div className="text-center py-8">
						<p className="text-red-500 text-lg font-medium">
							{error}
						</p>
					</div>
				)}

				{!loading && !error && profile && (
					<div className="space-y-6">
						<div className="flex items-left flex-col gap-2">
							<h1 className="text-2xl font-bold">
								{profile.full_name}
							</h1>
							<span className="text-lg font-bold">
								[ {profile.alias} ]
							</span>

							<Tabs
								defaultValue="overview"
								className="w-full mt-2"
							>
								<div className="flex justify-between items-center">
									<TabsList className="flex gap-4">
										<TabsTrigger
											value="overview"
											className="cursor-pointer"
										>
											Profile
										</TabsTrigger>
										<TabsTrigger
											value="analytics"
											className="cursor-pointer"
										>
											Cases
										</TabsTrigger>
										<TabsTrigger
											value="reports"
											className="cursor-pointer"
										>
											Drugs
										</TabsTrigger>
										<TabsTrigger
											value="settings"
											className="cursor-pointer"
										>
											Connections
										</TabsTrigger>
										<TabsTrigger
											value="areas"
											className="cursor-pointer"
										>
											Areas
										</TabsTrigger>
									</TabsList>
									<div className="flex gap-4">
										<Button
											variant="secondary"
											className="cursor-pointer"
											onClick={() =>
												navigate(`/profile/${id}/edit`)
											}
										>
											<Plus className="h-4 w-4 mr-2" />
											File Case
										</Button>
										<Button
											variant="secondary"
											className="cursor-pointer"
											onClick={() =>
												navigate(`/profile/${id}/edit`)
											}
										>
											<MoreVertical className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<Separator className="my-4" />
								<TabsContent value="overview">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label className="text-gray-500">
												Full Name
											</Label>
											<p className="text-lg">
												{profile.full_name}
											</p>
										</div>

										{profile.alias && (
											<div className="space-y-2">
												<Label className="text-gray-500">
													Alias
												</Label>
												<p className="text-lg">
													{profile.alias}
												</p>
											</div>
										)}

										{profile.nic && (
											<div className="space-y-2">
												<Label className="text-gray-500">
													NIC
												</Label>
												<p className="text-lg">
													{profile.nic}
												</p>
											</div>
										)}

										{profile.address_line1 && (
											<div className="space-y-2">
												<Label className="text-gray-500">
													Address Line 1
												</Label>
												<p className="text-lg">
													{profile.address_line1}
												</p>
											</div>
										)}

										{profile.address_line2 && (
											<div className="space-y-2">
												<Label className="text-gray-500">
													Address Line 2
												</Label>
												<p className="text-lg">
													{profile.address_line2}
												</p>
											</div>
										)}

										{profile.city && (
											<div className="space-y-2">
												<Label className="text-gray-500">
													City
												</Label>
												<p className="text-lg">
													{profile.city}
												</p>
											</div>
										)}

										{profile.risk_level && (
											<div className="space-y-2">
												<Label className="text-gray-500">
													Risk Level
												</Label>
												<p className="text-lg">
													{profile.risk_level}
												</p>
											</div>
										)}

										{profile.status && (
											<div className="space-y-2">
												<Label className="text-gray-500">
													Status
												</Label>
												<p className="text-lg">
													{profile.status}
												</p>
											</div>
										)}
									</div>

									{profile.notes && (
										<div className="space-y-2">
											<Label className="text-gray-500">
												Notes
											</Label>
											<p className="text-lg whitespace-pre-wrap">
												{profile.notes}
											</p>
										</div>
									)}

									{profile.created_at && (
										<div className="space-y-2 pt-4">
											<Label className="text-gray-500">
												Created At
											</Label>
											<p className="text-sm text-gray-600">
												{new Date(
													profile.created_at,
												).toLocaleString()}
											</p>
										</div>
									)}
								</TabsContent>
								<TabsContent value="analytics"></TabsContent>
								<TabsContent value="reports"></TabsContent>
								<TabsContent value="settings"></TabsContent>
								<TabsContent value="areas"></TabsContent>
							</Tabs>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
