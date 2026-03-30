"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Role = "professor" | "student";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  // --- Login state ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // --- Signup state ---
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<Role>("student");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error || !data.user) {
      setLoginError(error?.message ?? "Login failed.");
      setLoginLoading(false);
      return;
    }

    // Fetch role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role: Role = profile?.role ?? "student";
    router.push(`/dashboard/${role}`);
  }

  // ---------------------------------------------------------------------------
  // Signup
  // ---------------------------------------------------------------------------
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError("");

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          full_name: signupName,
          role: signupRole,
        },
      },
    });

    if (error || !data.user) {
      setSignupError(error?.message ?? "Sign-up failed.");
      setSignupLoading(false);
      return;
    }

    // Insert profile row (the trigger may already do this, but this is safe)
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email: signupEmail,
      full_name: signupName,
      role: signupRole,
    });

    if (profileError) {
      setSignupError(profileError.message);
      setSignupLoading(false);
      return;
    }

    setSignupLoading(false);

    // If email confirmation is off, session is immediately available
    if (data.session) {
      router.push(`/dashboard/${signupRole}`);
    } else {
      setSignupSuccess(true);
    }
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      {/* Background accent */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-navy/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo / heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy mb-4">
            <span className="text-gold font-extrabold text-xl">E</span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy">EduAI</h1>
          <p className="text-muted-foreground text-sm mt-1">
            IIIT Dharwad — Academic AI Platform
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted rounded-xl">
            <TabsTrigger
              value="login"
              className="rounded-lg data-[state=active]:bg-navy data-[state=active]:text-white font-semibold"
            >
              Log In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="rounded-lg data-[state=active]:bg-navy data-[state=active]:text-white font-semibold"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------------------ */}
          {/* LOGIN TAB                                                           */}
          {/* ------------------------------------------------------------------ */}
          <TabsContent value="login">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-navy text-xl">Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your EduAI account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@iiitdwd.ac.in"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  {loginError && (
                    <p className="text-sm text-destructive">{loginError}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-navy hover:bg-navy/90 text-white font-semibold"
                  >
                    {loginLoading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ------------------------------------------------------------------ */}
          {/* SIGNUP TAB                                                          */}
          {/* ------------------------------------------------------------------ */}
          <TabsContent value="signup">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-navy text-xl">
                  Create account
                </CardTitle>
                <CardDescription>
                  Join EduAI as a Professor or Student.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signupSuccess ? (
                  <div className="py-6 text-center space-y-2">
                    <div className="text-4xl">✉️</div>
                    <p className="font-semibold text-navy">Check your inbox</p>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ve sent a confirmation link to{" "}
                      <span className="font-medium">{signupEmail}</span>.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Dr. Anjali Sharma"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@iiitdwd.ac.in"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>

                    {/* Role selector */}
                    <div className="space-y-2">
                      <Label>I am a…</Label>
                      <RadioGroup
                        value={signupRole}
                        onValueChange={(v) => setSignupRole(v as Role)}
                        className="grid grid-cols-2 gap-3"
                      >
                        {(["student", "professor"] as Role[]).map((r) => (
                          <label
                            key={r}
                            htmlFor={`role-${r}`}
                            className={`flex items-center gap-2 cursor-pointer rounded-lg border-2 px-4 py-3 transition-colors ${
                              signupRole === r
                                ? "border-navy bg-navy/5 text-navy font-semibold"
                                : "border-border hover:border-navy/40"
                            }`}
                          >
                            <RadioGroupItem
                              value={r}
                              id={`role-${r}`}
                              className="sr-only"
                            />
                            <span className="capitalize text-sm">{r}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>

                    {signupError && (
                      <p className="text-sm text-destructive">{signupError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full bg-navy hover:bg-navy/90 text-white font-semibold"
                    >
                      {signupLoading ? "Creating account…" : "Create Account"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} IIIT Dharwad. All rights reserved.
        </p>
      </div>
    </main>
  );
}
