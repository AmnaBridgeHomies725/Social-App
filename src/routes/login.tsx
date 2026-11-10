import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser } from "../server/auth.function";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			const data = await loginUser({
				data: {
					email,
					password,
				},
			});

			localStorage.setItem("user", JSON.stringify(data.user));
			navigate({ to: "/" });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Invalid email or password",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md border border-[var(--line)] bg-[var(--surface-strong)] shadow-xl backdrop-blur-md">
				<CardHeader className="text-center pb-2">
					<h2 className="text-2xl font-extrabold text-[var(--sea-ink)]">
						💬 Social App
					</h2>
					<CardTitle className="text-xl font-bold text-[var(--sea-ink)] mt-2">
						Welcome Back!
					</CardTitle>
					<CardDescription className="text-[var(--sea-ink-soft)]">
						Login to connect with your community
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4">
						<div className="space-y-1.5">
							<Label
								htmlFor="email"
								className="font-semibold text-[var(--sea-ink)]"
							>
								Email Address
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink)]"
							/>
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="password"
								className="font-semibold text-[var(--sea-ink)]"
							>
								Password
							</Label>
							<Input
								id="password"
								type="password"
								placeholder="Enter your password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink)]"
							/>
						</div>

						{error && (
							<div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-600 font-medium">
								{error}
							</div>
						)}

						<Button
							type="submit"
							className="w-full bg-[#173a40] hover:bg-[#246f76] text-white font-semibold py-2.5 rounded-lg shadow-sm"
							disabled={isLoading}
						>
							{isLoading ? "Logging in..." : "Login"}
						</Button>

						<div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-xs text-[var(--sea-ink-soft)] space-y-1 mt-4">
							<p className="font-bold text-[var(--sea-ink)]">Demo Account:</p>
							<p>
								User:{" "}
								<span className="font-mono text-[var(--sea-ink)]">
									user1@example.com
								</span>{" "}
								/{" "}
								<span className="font-mono text-[var(--sea-ink)]">
									User@123
								</span>
							</p>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
