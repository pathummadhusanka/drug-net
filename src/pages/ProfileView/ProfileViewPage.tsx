import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function ProfileView() {
	const { id } = useParams();
	const navigate = useNavigate();

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
			<p>Profile ID: {id}</p>
		</>
	);
}
