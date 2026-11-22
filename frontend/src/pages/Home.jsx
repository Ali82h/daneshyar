import { Link } from "react-router-dom";
import {
	GraduationCap,
	UserRound,
	Pencil,
	PlusSquare,
	ListChecks,
	Search,
	CheckCircle2,
	Megaphone,
	FileText,
	Settings,
} from "lucide-react";
import universityImage from "../assets/university.jpg";
import "./Home.css";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function Home() {
	const { user } = useAuth();
	const [selectedFeature, setSelectedFeature] = useState(null);

	const dashboardPaths = {
		student: "/student/dashboard",
		manager: "/manager/dashboard",
		expert: "/expert/dashboard",
	};


	useEffect(() => {
		if (!selectedFeature) return;

		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setSelectedFeature(null);
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [selectedFeature]);

	const features = [
		{
			icon: PlusSquare,
			title: "ثبت مشکل جدید",
			description: "مشکل خود را به‌سادگی ثبت کنید",
			details:
				"اگر در محیط دانشگاه با مشکلی روبه‌رو شده‌اید، می‌توانید از طریق این سامانه آن را ثبت کنید. کافی است اطلاعات مشکل، محل وقوع و توضیحات لازم را وارد کنید تا درخواست شما برای بررسی ارسال شود.",
			buttonText: "ثبت مشکل جدید",
			path: "/student/issues/create",
		},
		{
			icon: ListChecks,
			title: "اولویت‌بندی و ارجاع",
			description: "درخواست شما بررسی و به واحد مربوطه ارجاع می‌شود",
			details:
				"پس از ثبت درخواست، مدیر سامانه اطلاعات آن را بررسی می‌کند و در صورت تأیید، درخواست را به واحد مسئول و کارشناس مربوطه ارجاع می‌دهد. به این ترتیب، هر مشکل توسط بخش مرتبط پیگیری خواهد شد.",
		},
		{
			icon: Search,
			title: "پیگیری درخواست‌ها",
			description: "از روند رسیدگی به درخواست خود مطلع شوید",
			details:
				"در بخش پیگیری درخواست‌ها می‌توانید فهرست مشکلات ثبت‌شده خود را مشاهده کنید، وضعیت هر درخواست را بررسی کنید و از آخرین تغییرات و روند رسیدگی به آن مطلع شوید.",
			buttonText: "پیگیری درخواست‌ها",
			path: "/student/issues",
		},
		{
			icon: CheckCircle2,
			title: "حل مشکل",
			description: "نتیجه نهایی رسیدگی را دریافت کنید",
			details:
				"پس از ارجاع درخواست، کارشناس مسئول رسیدگی به مشکل را آغاز می‌کند و وضعیت آن را در سامانه به‌روزرسانی می‌کند. پس از رفع مشکل، نتیجه نهایی ثبت می‌شود و دانشجو می‌تواند از طریق سامانه آن را مشاهده کند.",
		},
	];

	const steps = [
		{
			icon: FileText,
			title: "ثبت درخواست",
			description: "مشکل خود را ثبت کنید",
		},
		{
			icon: Settings,
			title: "بررسی و ارجاع",
			description: "درخواست شما بررسی و به واحد مربوطه ارجاع می‌شود",
		},
		{
			icon: CheckCircle2,
			title: "پیگیری وضعیت",
			description: "از روند رسیدگی مطلع شوید",
		},
		{
			icon: Megaphone,
			title: "حل مشکل",
			description: "نتیجه نهایی را دریافت کنید",
		},
	];

	return (
		<div className="home-page" dir="rtl">
			<header className="home-header">
				<Link to="/" className="home-logo">
					<GraduationCap size={43} />
					<div>
						<strong>دانش‌یار</strong>
						<span>سامانه مدیریت مشکلات دانشگاه</span>
					</div>
				</Link>

				<div className="home-auth-actions">
					{user ? (
						<Link
							to={dashboardPaths[user.role] || "/"}
							className="home-login-button"
						>
							<UserRound size={18} />
							ورود به داشبورد
						</Link>
					) : (
						<>
							<Link to="/register" className="home-register-button">
								<Pencil size={17} />
								ثبت‌نام
							</Link>

							<Link to="/login" className="home-login-button">
								<UserRound size={18} />
								ورود
							</Link>
						</>
					)}
				</div>
			</header>

			<main>
				<section
					className="home-hero"
					style={{ backgroundImage: `url(${universityImage})` }}
				>
					<div className="home-hero-overlay">
						<div className="home-hero-content">
							<h1>دانش‌یار</h1>
							<h2>همراه شما در حل مشکلات دانشگاه</h2>
							<p>
								با سامانه دانش‌یار، مشکلات محیط دانشگاه را ثبت کنید و روند
								پیگیری آن را به‌سادگی دنبال کنید.
							</p>
							<Link
								to={user ? dashboardPaths[user.role] || "/" : "/login"}
								className="home-hero-button"
							>
								{user ? "ورود به داشبورد" : "ثبت و پیگیری مشکلات"}
							</Link>
						</div>
					</div>
				</section>

				<section className="home-features">
					{features.map((feature, index) => {
						const Icon = feature.icon;

						return (
							<div
								className="home-feature-card clickable"
								key={index}
								onClick={() => setSelectedFeature(feature)}
							>
								<div className={`home-feature-icon feature-${index + 1}`}>
									<Icon size={27} />
								</div>

								<div>
									<h3>{feature.title}</h3>
									<p>{feature.description}</p>
								</div>
							</div>
						);
					})}
				</section>

				<section className="home-steps">
					<div className="home-section-title">
						<span />
						<h2>نحوه کار سامانه</h2>
						<span />
					</div>

					<div className="home-steps-list">
						{steps.map((step, index) => {
							const Icon = step.icon;

							return (
								<div className="home-step" key={index}>
									<span className="home-step-number">{index + 1}</span>
									<div className="home-step-icon">
										<Icon size={39} />
									</div>
									<h3>{step.title}</h3>
									<p>{step.description}</p>
								</div>
							);
						})}
					</div>
				</section>
			</main>

			<footer className="home-footer">
				<div className="home-footer-brand">
					<GraduationCap size={36} />
					<span>دانش‌یار؛ برای دانشگاهی بهتر، با همراهی شما</span>
				</div>

				<div className="home-footer-links">
					<Link to="/login">ورود به سامانه</Link>
					<Link to="/register">ثبت‌نام</Link>
				</div>
			</footer>

			{selectedFeature && (
				<div
					className="home-modal-overlay"
					onClick={() => setSelectedFeature(null)}
				>
					<div
						className="home-modal"
						onClick={(event) => event.stopPropagation()}
					>
						<button
							className="home-modal-close"
							onClick={() => setSelectedFeature(null)}
							aria-label="بستن پنجره"
						>
							×
						</button>

						<div className="home-modal-icon">
							{(() => {
								const Icon = selectedFeature.icon;
								return <Icon size={34} />;
							})()}
						</div>

						<h2>{selectedFeature.title}</h2>

						<p>{selectedFeature.details}</p>

						{selectedFeature.path ? (
							<Link
								to={selectedFeature.path}
								className="home-modal-button"
								onClick={() => setSelectedFeature(null)}
							>
								{selectedFeature.buttonText}
							</Link>
						) : (
							<button
								className="home-modal-button"
								onClick={() => setSelectedFeature(null)}
							>
								متوجه شدم
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default Home;
