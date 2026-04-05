"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ApiResponse,
  authLogin,
  authForgotPassword,
  authRegister,
} from "@/services/authService";
import LogoNav from "@/assets/logo-nav/logo-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { checkPasswordResetStatus } from "@/services/passwordResetService";

const PASSWORD_RESET_NOTIFICATION_EMAIL_KEY =
  "password_reset_notification_email";

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
  const [rememberEmail, setRememberEmail] = useState(false);
  const [resetNotificationEmail, setResetNotificationEmail] = useState<
    string | null
  >(null);

  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    if (!rememberEmail) return;
    if (email.trim()) {
      localStorage.setItem("remembered_email", email.trim());
    }
  }, [email, rememberEmail]);

  useEffect(() => {
    const storedResetEmail = localStorage.getItem(
      PASSWORD_RESET_NOTIFICATION_EMAIL_KEY,
    );
    if (storedResetEmail) {
      setResetNotificationEmail(storedResetEmail);
    }
  }, []);

  const syncRememberedEmail = () => {
    if (rememberEmail && email.trim()) {
      localStorage.setItem("remembered_email", email.trim());
    } else {
      localStorage.removeItem("remembered_email");
    }
  };

  const persistResetNotificationEmail = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(PASSWORD_RESET_NOTIFICATION_EMAIL_KEY, trimmed);
      setResetNotificationEmail(trimmed);
    } else {
      localStorage.removeItem(PASSWORD_RESET_NOTIFICATION_EMAIL_KEY);
      setResetNotificationEmail(null);
    }
  };

  useEffect(() => {
    if (!resetNotificationEmail) return;

    let isMounted = true;

    (async () => {
      try {
        const response = await checkPasswordResetStatus(resetNotificationEmail);

        if (!response.success || !response.data) {
          return;
        }

        if (response.data.status === "completed") {
          toast.success(
            `Password ${response.data.email} sudah direset. Notifikasi ini hanya muncul di browser ini.`,
          );
          if (!isMounted) return;
          localStorage.removeItem(PASSWORD_RESET_NOTIFICATION_EMAIL_KEY);
          setResetNotificationEmail(null);
        }
      } catch (error) {
        console.error("check password reset status error:", error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [resetNotificationEmail]);

  const handleRememberChange = (checked: boolean) => {
    setRememberEmail(checked);
    if (!checked) {
      localStorage.removeItem("remembered_email");
    } else if (email.trim()) {
      localStorage.setItem("remembered_email", email.trim());
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    syncRememberedEmail();

    try {
      const response = await authLogin({ email, password });

      if (response.success) {
        await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
        toast.success("Login berhasil!");
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      toast.error((error as ApiResponse)?.error || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
        role: "admin toko",
      });

      if (response.success) {
        toast.success("Registrasi berhasil! Silakan login.");
        setCurrentView("login");
        setName("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error: unknown) {
      console.error("Register error:", error);
      const apiError = (error as { response?: { data?: ApiResponse } })
        ?.response?.data;
      toast.error(apiError?.error || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    persistResetNotificationEmail(email);
    setLoading(true);
    syncRememberedEmail();

    try {
      const response = await authForgotPassword(email);
      if (response.success) {
        toast.success(
          "Permintaan reset password telah dikirim ke admin sistem.",
        );
      } else {
        toast.error(response.error || "Gagal mengirim permintaan reset");
        return;
      }
      setCurrentView("login");
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      toast.error("Gagal mengirim permintaan reset password");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto grid min-h-screen grid-cols-1 lg:grid-cols-2 gap-0 p-4 lg:p-6">
        <section className="hidden lg:flex rounded-3xl border border-border bg-card p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="relative z-10 flex items-center justify-between">
            <LogoNav height={36} type="sidebar" />
            <span className="text-xs text-muted-foreground">POS Platform</span>
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl leading-tight font-semibold text-foreground">
              Kelola penjualan, stok, dan operasional toko dalam satu dashboard.
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
              Masuk untuk melihat ringkasan bisnis, memantau transaksi, dan
              mengambil keputusan lebih cepat.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div className="rounded-xl border bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Monitoring</p>
                <p className="text-sm font-medium mt-1">Penjualan harian</p>
              </div>
              <div className="rounded-xl border bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Kontrol</p>
                <p className="text-sm font-medium mt-1">Stok & piutang</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2026 Gunung Muria Grosir</span>
            <span>Konsisten, cepat, akurat.</span>
          </div>
        </section>
        <section className="flex items-center justify-center px-2 py-6 lg:px-10">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-sm p-6 sm:p-8">
            <div className="flex justify-end mb-4">
              <ThemeToggle />
            </div>
            <div className="lg:hidden mb-6 flex justify-center">
              <LogoNav height={34} type="sidebar" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 text-center relative">
                {currentView === "forgot" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCurrentView("login")}
                    className="absolute left-0 top-0 p-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <h1 className="text-2xl font-semibold text-foreground">
                  {currentView === "login" && "Masuk ke akun"}
                  {currentView === "register" && "Buat akun baru"}
                  {currentView === "forgot" && "Reset password"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {currentView === "login" &&
                    "Gunakan email dan password Anda untuk mengakses dashboard."}
                  {currentView === "register" &&
                    "Daftarkan akun operator untuk mulai menggunakan sistem POS."}
                  {currentView === "forgot" &&
                    "Masukkan email Anda, kami akan kirim tautan reset password."}
                </p>
              </div>

              <div className="space-y-4">
                {currentView === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nama pengguna"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@toko.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                {currentView !== "forgot" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 pr-11"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
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
                {currentView === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Ulangi password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 pr-11"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
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

                {currentView === "login" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        id="remember"
                        className="rounded border-input"
                        checked={rememberEmail}
                        onChange={(e) => handleRememberChange(e.target.checked)}
                      />
                      Ingat saya
                    </label>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() => setCurrentView("forgot")}
                    >
                      Lupa password?
                    </Button>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  "Memproses..."
                ) : (
                  <>
                    {currentView === "login" && "Masuk"}
                    {currentView === "register" && "Buat Akun"}
                    {currentView === "forgot" && "Kirim Link Reset"}
                  </>
                )}
              </Button>

              <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                {currentView === "login" ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {currentView === "login"
                  ? "Akses aman untuk pengguna terdaftar."
                  : "Gunakan data valid untuk membuat akun operator."}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {/* {currentView === "login" && (
                  <>
                    Belum punya akun?{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => setCurrentView("register")}
                    >
                      Daftar sekarang
                    </Button>
                  </>
                )} */}
                {currentView === "register" && (
                  <>
                    Sudah punya akun?{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => setCurrentView("login")}
                    >
                      Masuk
                    </Button>
                  </>
                )}
                {currentView === "forgot" && (
                  <>
                    Ingat password?{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => setCurrentView("login")}
                    >
                      Kembali ke login
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
