import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/settings")({
	component: Settings,
});

function Settings() {
	return (
		<div className="mx-auto w-full max-w-2xl">
			<h1 className="mb-6 text-3xl font-bold tracking-tight">Settings</h1>
			<Card>
				<CardHeader>
					<CardTitle>App settings</CardTitle>
				</CardHeader>
				<CardContent className="text-muted-foreground">
					<p>Account settings will be managed here.</p>
				</CardContent>
			</Card>
		</div>
	);
}
