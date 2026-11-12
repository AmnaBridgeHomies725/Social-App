import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (password.length < 8) {
			setError("Password kam se kam 8 characters ka hona chahiye.");
			return;
		}

		setIsLoading(true);

		const { error } = await authClient.signUp.email({
			name,
			email,
			password,
		});

		setIsLoading(false);

		if (error) {
			setError(error.message ?? "Registration nahi ho saki.");
			return;
		}

		navigate({ to: "/login" });
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md border border-[var(--line)] bg-[var(--surface-strong)] shadow-xl backdrop-blur-md">
				<CardHeader className="text-center pb-2">
					<h2 className="text-2xl font-extrabold text-[var(--sea-ink)]">
						💬 Social App
					</h2>
					<CardTitle className="text-xl font-bold text-[var(--sea-ink)] mt-2">
						Create Account
					</CardTitle>
					<CardDescription className="text-[var(--sea-ink-soft)]">
						Create your account to start sharing your thoughts and connecting with others!
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleRegister} className="space-y-4">
						<div className="space-y-1.5">
							<Label
								htmlFor="name"
								className="font-semibold text-[var(--sea-ink)]"
							>
								Full Name
							</Label>
							<Input
								id="name"
								type="text"
								placeholder="Enter your full name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								className="border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink)]"
							/>
						</div>

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
								placeholder="Enter a password (minimum 8 characters)"
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
							{isLoading ? "Account is being created..." : "Register"}
						</Button>

						<p className="text-center text-sm text-[var(--sea-ink-soft)]">
							Already have an account?{" "}
							<Link to="/login" className="font-semibold underline">
								Login 
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}