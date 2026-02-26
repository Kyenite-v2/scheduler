'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [emailError, setEmailError] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<boolean>(false);

    const handleLogin = async() => {
        setEmailError(false);
        setPasswordError(false);

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
        if(email.includes("@") === false) {
            setEmailError(true);
            toast.error("Invalid email format.");
            return
        }

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if(res.status !== 200 || data.error) {
            toast.error(data.error || "Login failed. Please try again.");
            return
        }

        return toast.success(data.message || "Login successful.");
    }

    return (
        <div className="relative py-12 px-4">
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
                    <Button className="w-full" onClick={handleLogin}>
                        Login
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}