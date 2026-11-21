
import {
	ClipboardList,
	MapPin,
	BarChart3,
	AlertTriangle,
	Clock3,
	CheckCircle2,
	FilePlus2,
	ArrowLeft,
	Megaphone,
	Building2,
	Wrench,
	Droplets,
	Lightbulb,
	X,
	BookOpen,
	HelpCircle,
	ChevronLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API_BASE_URL from "../config";
import universityImage from "../assets/university.jpg";

import "./StudentDashboard.css";

const quickActions = [
	{
		title: "ثبت مشکل جدید",
		description: "مشکل جدیدی در محیط دانشگاه ثبت کنید",
		icon: FilePlus2,
		color: "blue",
		action: "create",
	},
	{
		title: "مشکلات من",
		description: "درخواست‌های ثبت‌شده خود را پیگیری کنید",
		icon: ClipboardList,
		color: "purple",
		action: "issues",
	},
	{
		title: "راهنمای استفاده از سامانه",
		description: "با نحوه استفاده از امکانات سامانه آشنا شوید",
		icon: BookOpen,
		color: "green",
		action: "guide",
	},
	{
		title: "سؤالات متداول",
		description: "پاسخ سؤالات رایج خود را پیدا کنید",
		icon: HelpCircle,
		color: "orange",
		action: "faq",
	},
];

const recentIssues = [
	{
		id: "REQ-1024",
		title: "خرابی سیستم سرمایشی کلاس ۲۰۴",
		department: "تأسیسات",
		date: "۱۴۰۵/۰۸/۰۸",
		status: "در حال بررسی",
		statusType: "review",
		priority: "زیاد",
		priorityType: "high",
	},
	{
		id: "REQ-1023",
		title: "مشکل روشنایی محوطه دانشکده",
		department: "خدمات",
		date: "۱۴۰۵/۰۸/۰۷",
		status: "در حال انجام",
		statusType: "progress",
		priority: "متوسط",
		priorityType: "medium",
	},
	{
		id: "REQ-1022",
		title: "خرابی شیر آب سرویس بهداشتی",
		department: "تأسیسات",
		date: "۱۴۰۵/۰۸/۰۵",
		status: "حل‌شده",
		statusType: "resolved",
		priority: "عادی",
		priorityType: "normal",
	},
];

function StudentDashboard({ user, onLogout, onNavigate }) {
	const [issues, setIssues] = useState([]);
	const [loadingIssues, setLoadingIssues] = useState(true);
	const [issuesError, setIssuesError] = useState("");
	const [activeInfoModal, setActiveInfoModal] = useState(null);
	const [announcements, setAnnouncements] = useState([]);
	const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

	useEffect(() => {
		const fetchIssues = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/issues/my`, {
					credentials: "include",
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "دریافت درخواست‌ها ناموفق بود.");
				}

				setIssues(data.issues || []);
			} catch (error) {
				console.error("Fetch issues error:", error);
				setIssuesError(error.message);
			} finally {
				setLoadingIssues(false);
			}
		};

		fetchIssues();
	}, []);

	useEffect(() => {
		const fetchAnnouncements = async () => {
			try {
				const response = await fetch(
					`${API_BASE_URL}/api/announcements`,
					{
						credentials: "include",
					},
				);

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "دریافت اطلاعیه‌ها ناموفق بود.");
				}

				setAnnouncements(data.announcements || []);
			} catch (error) {
				console.error("Fetch announcements error:", error);
			} finally {
				setLoadingAnnouncements(false);
			}
		};

		fetchAnnouncements();
	}, []);

	const totalIssues = issues.length;

	const waitingCount = issues.filter(
		(issue) => issue.status === "submitted",
	).length;

	const resolvedCount = issues.filter(
		(issue) => issue.status === "resolved",
	).length;

	const inProgressCount = issues.filter(
		(issue) => issue.status === "assigned" || issue.status === "in_progress",
	).length;

	const rejectedCount = issues.filter(
		(issue) => issue.status === "rejected",
	).length;

	const activeCount = waitingCount + inProgressCount;

	const chartGradient =
		totalIssues === 0
			? "#e2e8f0"
			: `conic-gradient(
			#2563eb 0deg ${(waitingCount / totalIssues) * 360}deg,
			#16a34a ${(waitingCount / totalIssues) * 360}deg ${
				((waitingCount + resolvedCount) / totalIssues) * 360
			}deg,
			#f59e0b ${((waitingCount + resolvedCount) / totalIssues) * 360}deg ${
				((waitingCount + resolvedCount + inProgressCount) / totalIssues) * 360
			}deg,
			#ef4444 ${
				((waitingCount + resolvedCount + inProgressCount) / totalIssues) * 360
			}deg 360deg
		)`;

	const formatDate = (date) =>
		new Intl.DateTimeFormat("fa-IR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date(date));

	const getStatusLabel = (status) => {
		const statuses = {
			submitted: "ثبت‌شده",
			assigned: "ارجاع‌شده",
			in_progress: "در حال رسیدگی",
			resolved: "حل‌شده",
			rejected: "ردشده",
		};

		return statuses[status] || status;
	};

	const statistics = [
		{
			title: "کل درخواست‌ها",
			value: totalIssues,
			description: "تمام مشکلات ثبت‌شده",
			icon: ClipboardList,
			color: "blue",
		},
		{
			title: "در انتظار ارجاع",
			value: waitingCount,
			description: "درخواست‌های ثبت‌شده و ارجاع‌نشده",
			icon: Clock3,
			color: "orange",
		},
		{
			title: "در حال رسیدگی",
			value: inProgressCount,
			description: "درخواست‌های ارجاع‌شده و در حال انجام",
			icon: AlertTriangle,
			color: "red",
		},
		{
			title: "حل‌شده",
			value: resolvedCount,
			description: "درخواست‌های تکمیل‌شده",
			icon: CheckCircle2,
			color: "green",
		},
		{
			title: "ردشده",
			value: issues.filter((issue) => issue.status === "rejected").length,
			description: "درخواست‌های ردشده توسط مدیر",
			icon: X,
			color: "red",
		},
	];

	const infoModalContent = {
		guide: {
			title: "راهنمای استفاده از سامانه",
			description: "برای استفاده از سامانه دانش‌یار، مراحل زیر را دنبال کنید:",
			items: [
				{
					title: "۱. ثبت مشکل جدید",
					description:
						"از بخش ثبت مشکل جدید، دسته‌بندی، محل وقوع و توضیحات مشکل را وارد کنید. در صورت نیاز می‌توانید فایل یا تصویر هم پیوست کنید.",
				},
				{
					title: "۲. پیگیری درخواست",
					description:
						"از بخش مشکلات من می‌توانید درخواست‌های ثبت‌شده و آخرین وضعیت هرکدام را مشاهده کنید.",
				},
				{
					title: "۳. ارجاع به کارشناس",
					description:
						"پس از بررسی درخواست توسط مدیر سامانه، مشکل به کارشناس واحد مربوطه ارجاع داده می‌شود.",
				},
				{
					title: "۴. مشاهده نتیجه و پاسخ‌ها",
					description:
						"با ورود به جزئیات هر درخواست، می‌توانید روند رسیدگی، توضیحات و پیام‌های مربوط به آن را مشاهده کنید.",
				},
			],
		},
		faq: {
			title: "سؤالات متداول",
			description: "پاسخ برخی از پرسش‌های رایج درباره سامانه دانش‌یار:",
			items: [
				{
					title: "چطور از وضعیت درخواستم مطلع شوم؟",
					description:
						"از بخش مشکلات من، درخواست موردنظر را انتخاب کنید تا وضعیت و جزئیات آن را ببینید.",
				},
				{
					title: "چرا ممکن است درخواستم رد شود؟",
					description:
						"اگر درخواست قابل رسیدگی نباشد یا اطلاعات کافی نداشته باشد، مدیر می‌تواند آن را رد کند. دلیل رد در جزئیات درخواست نمایش داده می‌شود.",
				},
				{
					title: "مدت زمان رسیدگی به درخواست چقدر است؟",
					description:
						"زمان رسیدگی به نوع مشکل، اولویت آن و حجم درخواست‌های واحد مربوطه بستگی دارد و زمان ثابتی برای همه درخواست‌ها وجود ندارد.",
				},
				{
					title: "آیا می‌توانم با کارشناس ارتباط برقرار کنم؟",
					description:
						"بله، از بخش جزئیات درخواست می‌توانید پیام‌های مربوط به درخواست را مشاهده کرده و از طریق گفت‌وگو پیگیری کنید.",
				},
			],
		},
	};

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="dashboard">
			<div className="student-dashboard">
				{/* Welcome Banner */}

				<section
					className="welcome-banner"
					style={{ backgroundImage: `url(${universityImage})` }}
				>
					<div className="welcome-overlay" />

					<div className="welcome-content">
						<span className="welcome-label">
							<Building2 size={15} />
							دانشگاه شهرکرد
						</span>

						<h1>سلام، {user?.full_name || "دانشجوی عزیز"} 👋</h1>

						<p>
							با ثبت و پیگیری مشکلات، به بهبود محیط دانشگاه کمک کنید. ما در کنار
							شما هستیم.
						</p>

						<button
							className="welcome-button"
							type="button"
							onClick={() => onNavigate?.("create")}
						>
							ثبت مشکل جدید
							<ArrowLeft size={17} />
						</button>
					</div>
				</section>

				{/* Quick Actions */}

				<section className="dashboard-section">
					<div className="section-heading">
						<div>
							<h2>دسترسی سریع</h2>
							<p>امکانات پرکاربرد سامانه</p>
						</div>
					</div>

					<div className="quick-actions-grid">
						{quickActions.map((item) => {
							const Icon = item.icon;

							return (
								<button
									className="quick-action-card"
									key={item.action}
									type="button"
									onClick={() => {
										if (item.action === "guide" || item.action === "faq") {
											setActiveInfoModal(item.action);
										} else {
											onNavigate?.(item.action);
										}
									}}
								>
									<div className={`quick-action-icon ${item.color}`}>
										<Icon size={23} strokeWidth={1.8} />
									</div>

									<div className="quick-action-content">
										<h3>{item.title}</h3>
										<p>{item.description}</p>
									</div>

									<ChevronLeft size={18} className="quick-action-arrow" />
								</button>
							);
						})}
					</div>
				</section>

				{/* Statistics */}

				<section className="dashboard-section">
					<div className="section-heading">
						<div>
							<h2>نمای کلی درخواست‌ها</h2>
							<p>آخرین وضعیت درخواست‌های ثبت‌شده شما</p>
						</div>

						<span className="statistics-period">تمام مدت</span>
					</div>

					<div className="statistics-grid">
						{statistics.map((item) => {
							const Icon = item.icon;

							return (
								<article className="stat-card" key={item.title}>
									<div className={`stat-icon ${item.color}`}>
										<Icon size={22} />
									</div>

									<div className="stat-details">
										<span>{item.title}</span>
										<strong>{item.value}</strong>
										<small>{item.description}</small>
									</div>
								</article>
							);
						})}
					</div>
				</section>

				{/* Main Dashboard Grid */}

				<div className="dashboard-lower-grid">
					{/* Recent Issues */}

					<section className="dashboard-panel recent-issues-panel">
						<div className="panel-heading">
							<div>
								<h2>آخرین مشکلات ثبت‌شده</h2>
								<p>مروری بر آخرین درخواست‌های شما</p>
							</div>

							<button
								className="text-link"
								type="button"
								onClick={() => onNavigate?.("issues")}
							>
								مشاهده همه
								<ArrowLeft size={15} />
							</button>
						</div>

						<div className="issues-table-wrapper">
							<table className="issues-table">
								<thead>
									<tr>
										<th>عنوان مشکل</th>
										<th>دسته‌بندی</th>
										<th>محل وقوع</th>
										<th>تاریخ ثبت</th>
										<th>وضعیت</th>
									</tr>
								</thead>

								<tbody>
									{loadingIssues ? (
										<tr>
											<td colSpan="5">در حال دریافت درخواست‌ها...</td>
										</tr>
									) : issuesError ? (
										<tr>
											<td colSpan="5">{issuesError}</td>
										</tr>
									) : issues.length === 0 ? (
										<tr>
											<td colSpan="5">هنوز مشکلی ثبت نکرده‌اید.</td>
										</tr>
									) : (
										issues.slice(0, 3).map((issue) => {
											const statusTypes = {
												submitted: "review",
												assigned: "progress",
												in_progress: "progress",
												resolved: "resolved",
												rejected: "rejected",
											};

											return (
												<tr key={issue.id}>
													<td>
														<strong>{issue.title}</strong>
														<small>{issue.tracking_code}</small>
													</td>

													<td>{issue.category}</td>
													<td>{issue.location}</td>
													<td>{formatDate(issue.created_at)}</td>

													<td>
														<span
															className={`status-badge ${
																statusTypes[issue.status] || "review"
															}`}
														>
															{getStatusLabel(issue.status)}
														</span>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
					</section>

					{/* Issue Status Chart */}

					<section className="dashboard-panel status-panel">
						<div className="panel-heading">
							<div>
								<h2>وضعیت درخواست‌ها</h2>
								<p>توزیع درخواست‌های ثبت‌شده</p>
							</div>
						</div>

						<div className="status-chart">
							<div className="chart-ring" style={{ background: chartGradient }}>
								<div className="chart-ring-inner">
									<strong>{totalIssues.toLocaleString("fa-IR")}</strong>
									<span>کل درخواست‌ها</span>
								</div>
							</div>

							<div className="chart-legend">
								<div className="chart-legend">
									<div>
										<i className="legend-dot blue-dot" />
										<span>در انتظار ارجاع</span>
										<strong>{waitingCount.toLocaleString("fa-IR")}</strong>
									</div>

									<div>
										<i className="legend-dot green-dot" />
										<span>حل‌شده</span>
										<strong>{resolvedCount.toLocaleString("fa-IR")}</strong>
									</div>

									<div>
										<i className="legend-dot orange-dot" />
										<span>در حال رسیدگی</span>
										<strong>{inProgressCount.toLocaleString("fa-IR")}</strong>
									</div>

									<div>
										<i className="legend-dot red-dot" />
										<span>ردشده</span>
										<strong>{rejectedCount.toLocaleString("fa-IR")}</strong>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Announcements */}

					<section className="dashboard-panel announcements-panel">
						<div className="panel-heading">
							<div>
								<h2>اطلاعیه‌های دانشگاه</h2>
								<p>آخرین اخبار و اطلاعیه‌ها</p>
							</div>

							<button
								className="text-link"
								type="button"
								onClick={() => onNavigate?.("announcements")}
							>
								مشاهده همه
								<ArrowLeft size={15} />
							</button>
						</div>

						<div className="announcements-list">
							{loadingAnnouncements ? (
								<p>در حال دریافت اطلاعیه‌ها...</p>
							) : announcements.length === 0 ? (
								<p>در حال حاضر اطلاعیه‌ای برای نمایش وجود ندارد.</p>
							) : (
								announcements.slice(0, 2).map((announcement) => (
									<article className="announcement-item" key={announcement.id}>
										<div className="announcement-icon">
											<Megaphone size={20} />
										</div>

										<div className="announcement-content">
											<h3>{announcement.title}</h3>
											<p>{announcement.content}</p>
											<span>
												{new Date(announcement.created_at).toLocaleDateString(
													"fa-IR",
												)}
											</span>
										</div>
									</article>
								))
							)}
						</div>
					</section>

					{/* Help Card */}

					<section className="help-card">
						<div className="help-card-icon">
							<Lightbulb size={25} />
						</div>

						<h2>چطور یک مشکل را ثبت کنیم؟</h2>

						<p>
							محل وقوع، توضیحات دقیق و در صورت امکان تصویر مشکل را ثبت کنید تا
							کارشناسان بتوانند سریع‌تر آن را بررسی کنند.
						</p>

						<button type="button" onClick={() => onNavigate?.("create")}>
							شروع ثبت مشکل
							<ArrowLeft size={16} />
						</button>
					</section>
				</div>

				{activeInfoModal && (
					<div
						className="student-info-modal-overlay"
						onClick={() => setActiveInfoModal(null)}
					>
						<div
							className="student-info-modal"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="student-info-modal-header">
								<div>
									<h2>{infoModalContent[activeInfoModal].title}</h2>
									<p>{infoModalContent[activeInfoModal].description}</p>
								</div>

								<button
									type="button"
									onClick={() => setActiveInfoModal(null)}
									aria-label="بستن"
								>
									<X size={20} />
								</button>
							</div>

							<div className="student-info-modal-body">
								{infoModalContent[activeInfoModal].items.map((item, index) => (
									<div className="student-info-modal-item" key={index}>
										<h3>{item.title}</h3>
										<p>{item.description}</p>
									</div>
								))}
							</div>

							<div className="student-info-modal-footer">
								<button type="button" onClick={() => setActiveInfoModal(null)}>
									متوجه شدم
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}

export default StudentDashboard;
