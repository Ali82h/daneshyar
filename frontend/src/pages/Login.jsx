import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import "./login.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API_BASE_URL from "../config";

function Login() {
	const navigate = useNavigate();
	const location = useLocation();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [checkingSession, setCheckingSession] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user) {
					const destinations = {
						student: "/student/dashboard",
						manager: "/manager/dashboard",
						expert: "/expert/dashboard",
					};

					const destination = destinations[data.user.role];

					if (destination) {
						navigate(destination, {
							replace: true,
							state: { user: data.user },
						});
						return;
					}
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setCheckingSession(false);
			}
		};

		checkSession();
	}, [navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!email.trim() || !password) {
			setError("ایمیل و رمز عبور را وارد کنید.");
			return;
		}

		try {
			setLoading(true);

			const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					email: email.trim(),
					password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "ورود ناموفق بود.");
			}

			const destinations = {
				student: "/student/dashboard",
				manager: "/manager/dashboard",
				expert: "/expert/dashboard",
			};

			const role = data.user?.role;
			let destination = destinations[role];

			if (!destination) {
				throw new Error("نقش کاربری معتبر نیست.");
			}

			// فقط دانشجو می‌تواند به صفحه درخواستی قبلی برگردد.
			const previousPath = location.state?.from?.pathname;

			if (role === "student" && previousPath?.startsWith("/student/")) {
				destination = previousPath;
			}

			navigate(destination, {
				replace: true,
				state: { user: data.user },
			});
		} catch (err) {
			setError(
				err.message === "Failed to fetch"
					? "ارتباط با سرور برقرار نشد. از روشن بودن بک‌اند مطمئن شوید."
					: err.message,
			);
		} finally {
			setLoading(false);
		}
	};

	if (checkingSession) {
		return (
			<main className="login-page" dir="rtl">
				<section className="login-card">
					<p>در حال بررسی وضعیت ورود...</p>
				</section>
			</main>
		);
	}
	return (
		<main className="login-page" dir="rtl">
			<section className="login-card">
				<div className="login-brand">
					<div className="login-brand-icon">د</div>
					<span>سامانه هوشمند دانشگاه</span>
				</div>

				<div className="login-heading">
					<h1>خوش آمدید</h1>
					<p>برای ورود به حساب کاربری خود اطلاعات زیر را وارد کنید.</p>
				</div>

				<form onSubmit={handleSubmit} className="login-form">
					<div className="login-field">
						<label htmlFor="email">آدرس ایمیل</label>
						<div className="login-input-wrapper">
							<Mail size={19} />
							<input
								id="email"
								type="email"
								placeholder="example@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete="email"
								dir="ltr"
							/>
						</div>
					</div>

					<div className="login-field">
						<label htmlFor="password">رمز عبور</label>
						<div className="login-input-wrapper">
							<Lock size={19} />
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="رمز عبور خود را وارد کنید"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete="current-password"
							/>
							<button
								type="button"
								className="password-toggle"
								onClick={() => setShowPassword(!showPassword)}
								aria-label="نمایش یا مخفی کردن رمز عبور"
							>
								{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
							</button>
						</div>
					</div>

					{error && <div className="login-error">{error}</div>}

					<button type="submit" className="login-submit" disabled={loading}>
						{loading ? "در حال ورود..." : "ورود به حساب کاربری"}
						{!loading && <ArrowLeft size={18} />}
					</button>
				</form>

				<div className="login-footer">
					<span>حساب کاربری ندارید؟</span>
					<Link to="/register">ثبت‌نام دانشجو</Link>
				</div>

				<Link to="/" className="login-home-link">
					بازگشت به صفحه اصلی
				</Link>
			</section>
		</main>
	);
}

export default Login;
