
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import {
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("لطفاً تمام فیلدها را تکمیل کنید.");
      return;
    }

    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }

    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن مطابقت ندارند.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ثبت‌نام ناموفق بود.");
      }

      if (!data.user) {
        throw new Error("حساب ساخته شد، اما اطلاعات کاربر دریافت نشد.");
      }

      navigate("/student/dashboard", {
        replace: true,
        state: { user: data.user },
      });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "ارتباط با سرور برقرار نشد. از روشن بودن بک‌اند مطمئن شوید."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page" dir="rtl">
      <section className="register-card">
        <div className="register-brand">
          <div className="register-brand-icon">د</div>
          <span>سامانه هوشمند دانشگاه</span>
        </div>

        <div className="register-heading">
          <h1>ایجاد حساب دانشجویی</h1>
          <p>
            برای استفاده از امکانات سامانه، اطلاعات زیر را وارد کنید.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-field">
            <label htmlFor="fullName">نام و نام خانوادگی</label>
            <div className="register-input-wrapper">
              <UserRound size={19} />
              <input
                id="fullName"
                type="text"
                placeholder="نام و نام خانوادگی"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="registerEmail">آدرس ایمیل</label>
            <div className="register-input-wrapper">
              <Mail size={19} />
              <input
                id="registerEmail"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                dir="ltr"
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="registerPassword">رمز عبور</label>
            <div className="register-input-wrapper">
              <Lock size={19} />
              <input
                id="registerPassword"
                type={showPassword ? "text" : "password"}
                placeholder="حداقل ۸ کاراکتر"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="نمایش یا مخفی کردن رمز عبور"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="confirmPassword">تکرار رمز عبور</label>
            <div className="register-input-wrapper">
              <Lock size={19} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="رمز عبور را دوباره وارد کنید"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label="نمایش یا مخفی کردن تکرار رمز عبور"
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {error && <div className="register-error">{error}</div>}

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading ? "در حال ایجاد حساب..." : "ایجاد حساب کاربری"}
            {!loading && <ArrowLeft size={18} />}
          </button>
        </form>

        <div className="register-footer">
          <span>قبلاً ثبت‌نام کرده‌اید؟</span>
          <Link to="/login">ورود به حساب</Link>
        </div>

        <Link to="/" className="register-home-link">
          بازگشت به صفحه اصلی
        </Link>
      </section>
    </main>
  );
}

export default Register;
