"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { ApiResponse, authLogin, authRegister } from "@/services/authService";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentView, setCurrentView] = useState<
    "login" | "register" | "forgot"
  >("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authLogin({ email, password });

      if (response.success) {
        toast.success("Login berhasil!");
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      console.error("Network/Login error:", error);
      toast.error((error as ApiResponse)?.error || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validasi password
    if (password !== confirmPassword) {
      toast.error("Password dan konfirmasi password tidak sama");
      setLoading(false);
      return;
    }

    try {
      const response = await authRegister({
        name,
        email,
        password,
        roles: ["admin toko"], // Default role for public registration
      } as any);

      if (response.success) {
        toast.success("Registrasi berhasil! Silakan login.");
        setCurrentView("login");
        setName("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      console.error("Register error:", error);
      toast.error(error.response?.data?.error || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Panggil API reset password di sini
      // const response = await authForgotPassword({ email });

      // Untuk sementara, simulasi berhasil
      toast.success("Link reset password telah dikirim ke email Anda.");
      setCurrentView("login");
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      toast.error("Gagal mengirim link reset password");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menentukan handler berdasarkan view
  const handleSubmit = (e: React.FormEvent) => {
    switch (currentView) {
      case "login":
        return handleLogin(e);
      case "register":
        return handleRegister(e);
      case "forgot":
        return handleForgotPassword(e);
      default:
        return handleLogin(e);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Bagian kiri (biru) tetap sama */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: "#3F3FF3" }}
      >
        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
              <div
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: "#3F3FF3" }}
              ></div>
            </div>
            <h1 className="text-xl font-semibold text-white">Frello</h1>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl text-white mb-6 leading-tight">
              Effortlessly manage your team and operations.
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Log in to access your CRM dashboard and manage your team.
            </p>
          </div>

          <div className="flex justify-between items-center text-white/70 text-sm">
            <span>Copyright © 2025 Frello Enterprises LTD.</span>
            <span className="cursor-pointer hover:text-white/90">
              Privacy Policy
            </span>
          </div>
        </div>
      </div>

      {/* Bagian kanan (form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo untuk mobile */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: "#3F3FF3" }}
            >
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Frello</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header dengan tombol back untuk forgot password */}
            <div className="space-y-2 text-center relative">
              {currentView === "forgot" && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentView("login")}
                  className="absolute left-0 top-0 p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h2 className="text-3xl text-foreground">
                {currentView === "login" && "Welcome Back"}
                {currentView === "register" && "Create Account"}
                {currentView === "forgot" && "Reset Password"}
              </h2>
              <p className="text-muted-foreground">
                {currentView === "login" &&
                  "Enter your email and password to access your account."}
                {currentView === "register" &&
                  "Create a new account to get started with Frello."}
                {currentView === "forgot" &&
                  "Enter your email address and we'll send you a reset link."}
              </p>
            </div>

            <div className="space-y-4">
              {/* Field untuk register */}
              {currentView === "register" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-foreground"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#3F3FF3]"
                    required={currentView === "register"}
                  />
                </div>
              )}

              {/* Email field (selalu ditampilkan) */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#3F3FF3]"
                  required
                />
              </div>

              {/* Password field (tidak untuk forgot password) */}
              {currentView !== "forgot" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#3F3FF3]"
                      required={
                        currentView === "login" || currentView === "register"
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Confirm password (hanya untuk register) */}
              {currentView === "register" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#3F3FF3]"
                      required={currentView === "register"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Remember me dan forgot password (hanya untuk login) */}
              {currentView === "login" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="rounded border-gray-300 cursor-pointer"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember Me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm hover:text-opacity-80 cursor-pointer"
                    style={{ color: "#3F3FF3" }}
                    onClick={() => setCurrentView("forgot")}
                  >
                    Forgot Your Password?
                  </Button>
                </div>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-12 text-sm font-medium text-white hover:opacity-90 rounded-lg shadow-none cursor-pointer"
              style={{ backgroundColor: "#3F3FF3" }}
              disabled={loading}
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  {currentView === "login" && "Log In"}
                  {currentView === "register" && "Create Account"}
                  {currentView === "forgot" && "Send Reset Link"}
                </>
              )}
            </Button>
            {/* Link untuk pindah antar view */}
            <div className="text-center text-sm text-muted-foreground">
              {currentView === "login" && (
                <>
                  Don't Have An Account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer"
                    style={{ color: "#3F3FF3" }}
                    onClick={() => setCurrentView("register")}
                  >
                    Register Now.
                  </Button>
                </>
              )}
              {currentView === "register" && (
                <>
                  Already Have An Account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer"
                    style={{ color: "#3F3FF3" }}
                    onClick={() => setCurrentView("login")}
                  >
                    Sign In.
                  </Button>
                </>
              )}
              {currentView === "forgot" && (
                <>
                  Remember Your Password?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer"
                    style={{ color: "#3F3FF3" }}
                    onClick={() => setCurrentView("login")}
                  >
                    Back to Login.
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
