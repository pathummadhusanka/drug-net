import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

			<div className="max-w-[800px] mx-auto">
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
						<div className="flex items-center justify-between">
							<h1 className="text-2xl font-bold">
								{profile.full_name}
							</h1>
							<Button
								variant="default"
								className="cursor-pointer"
								onClick={() =>
									navigate(`/profile/${id}/edit`)
								}
							>
								Edit Profile
							</Button>
						</div>

						<Separator />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label className="text-gray-500">
									Full Name
								</Label>
								<p className="text-lg">{profile.full_name}</p>
							</div>

							{profile.alias && (
								<div className="space-y-2">
									<Label className="text-gray-500">
										Alias
									</Label>
									<p className="text-lg">{profile.alias}</p>
								</div>
							)}

							{profile.nic && (
								<div className="space-y-2">
									<Label className="text-gray-500">NIC</Label>
									<p className="text-lg">{profile.nic}</p>
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
									<p className="text-lg">{profile.city}</p>
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
									<p className="text-lg">{profile.status}</p>
								</div>
							)}
						</div>

						{profile.notes && (
							<div className="space-y-2">
								<Label className="text-gray-500">Notes</Label>
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
										profile.created_at
									).toLocaleString()}
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</>
	);
}

