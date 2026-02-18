import { useParams } from "react-router-dom";

export default function ProfileView() {
	const { id } = useParams();

	return (
		<>
			<p>Profile ID: {id}</p>
		</>
	);
}
