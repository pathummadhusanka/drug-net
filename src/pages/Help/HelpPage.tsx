import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
	return (
		<div className="container mx-auto p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Help</h1>
				<p className="text-muted-foreground">
					Application support information
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>DrugNet Help</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm text-muted-foreground">
					<p>
						If you need assistance using DrugNet, contact your
						system administrator.
					</p>
					<p>Application Name: DrugNet</p>
					<p>Version: 1.0.0-alpha.1</p>
				</CardContent>
			</Card>
		</div>
	);
}
