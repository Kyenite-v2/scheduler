'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [emailError, setEmailError] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const handleLogin = async (e: SubmitEvent) => {
        e.preventDefault();
        setEmailError(false);
        setPasswordError(false);
        setLoading(true);

        try {
            if (!email) {
                setEmailError(true);
                toast.error("Email is required.");
                return
            }
            if (!password) {
                setPasswordError(true);
                toast.error("Password is required.");
                return
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setEmailError(true);
                toast.error("Invalid email format.");
                return;
            }

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (res.status !== 200 || data.error) {
                setPassword("")
                toast.error(data.error || "Login failed. Please try again.");
                return
            }

            toast.success(data.message || "Login successful.");
            return router.push("/a/schedules");
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-100 py-12 pt-24 px-4 space-y-28">
            <form onSubmit={handleLogin}>
                <Card className="mx-auto max-w-sm">
                    <CardHeader>
                        <h2 className="text-2xl font-bold mb-4">Login</h2>
                        <p className="text-sm text-muted-foreground">
                            Please enter your credentials to access the scheduling system.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <Label htmlFor="email" className="mb-1">
                                Email
                            </Label>
                            <Input
                                type="email"
                                id="email"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-invalid={emailError}
                            />
                        </div>
                        <div className="mt-4">
                            <Label htmlFor="password" className="mb-1">
                                Password
                            </Label>
                            <Input
                                type="password"
                                id="password"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                aria-invalid={passwordError}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                            {loading ? <Loader2 className="mx-auto animate-spin" /> : "Sign In"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
            <footer className="border-t text-sm text-muted-foreground text-center p-4">
                &copy; {new Date().getFullYear()} Kenneth Medel
            </footer>
        </div>
    )
}