import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
	Bell,
	Search,
	UserRound,
	LayoutDashboard,
	ClipboardList,
	PlusCircle,
	BarChart3,
	Megaphone,
	Settings,
	LogOut,
	ChevronLeft,
	Users,
	Building2,
	MoreHorizontal,
} from "lucide-react";

import "./DashboardLayout.css";
import API_BASE_URL from "../../config";

const studentMenuItems = [
	{ label: "داشبورد", icon: LayoutDashboard, id: "dashboard" },
	{ label: "ثبت مشکل جدید", icon: PlusCircle, id: "create" },
	{ label: "مشکلات من", icon: ClipboardList, id: "issues" },
	{ label: "اطلاعیه‌ها", icon: Megaphone, id: "announcements" },
];

const expertMenuItems = [
	{ label: "داشبورد", icon: LayoutDashboard, id: "dashboard" },
	{ label: "درخواست‌های ارجاع‌شده", icon: ClipboardList, id: "issues" },
	{ label: "آمار و گزارش‌ها", icon: BarChart3, id: "reports" },
	{ label: "اطلاعیه‌ها", icon: Megaphone, id: "announcements" },
];

const managerMenuItems = [
	{ label: "داشبورد", icon: LayoutDashboard, id: "dashboard" },
	{ label: "درخواست‌های بررسی‌نشده", icon: ClipboardList, id: "issues" },
	{ label: "گزارش‌ها و آمار", icon: BarChart3, id: "reports" },
	{ label: "مدیریت کاربران", icon: Users, id: "users" },
	{ label: "مدیریت واحدها", icon: Building2, id: "departments" },
	{ label: "اطلاعیه‌ها", icon: Megaphone, id: "announcements" },
];

function DashboardLayout({
	children,
	user,
	activeItem = "dashboard",
	onLogout,
}) {
	const navigate = useNavigate();

	const [showNotifications, setShowNotifications] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loadingNotifications, setLoadingNotifications] = useState(false);
	const [mobileMenu, setMobileMenu] = useState(null);

	const notificationRef = useRef(null);

	const isExpert = user?.role === "expert";
	const isManager = user?.role === "manager";

	const menuItems = isManager
		? managerMenuItems
		: isExpert
			? expertMenuItems
			: studentMenuItems;

	const roleLabel = isManager
		? "مدیر سامانه"
		: isExpert
			? "کارشناس رسیدگی"
			: "دانشجو";

	const routes = isManager
		? {
				dashboard: "/manager/dashboard",
				issues: "/manager/issues",
				reports: "/manager/reports",
				users: "/manager/users",
				departments: "/manager/departments",
				announcements: "/manager/announcements",
			}
		: isExpert
			? {
					dashboard: "/expert/dashboard",
					issues: "/expert/issues",
					reports: "/expert/reports",
					announcements: "/expert/announcements",
				}
			: {
					dashboard: "/student/dashboard",
					create: "/student/issues/create",
					issues: "/student/issues",
					announcements: "/student/announcements",
				};

	const navigateTo = (path) => {
		setMobileMenu(null);
		setShowNotifications(false);
		navigate(path);
	};

	const handleLogout = () => {
		setMobileMenu(null);
		onLogout?.();
	};

	useEffect(() => {
		const fetchUnreadCount = async () => {
			try {
				const response = await fetch(
					`${API_BASE_URL}/api/notifications/unread-count`,
					{ credentials: "include" },
				);

				if (!response.ok) return;

				const data = await response.json();
				setUnreadCount(data.count);
			} catch (error) {
				console.error("Fetch unread notifications count error:", error);
			}
		};

		fetchUnreadCount();
	}, []);

	useEffect(() => {
		if (!showNotifications) return;

		const fetchUnreadCount = async () => {
			try {
				const response = await fetch(
					`${API_BASE_URL}/api/notifications/unread-count`,
					{ credentials: "include" },
				);

				if (!response.ok) return;

				const data = await response.json();
				setUnreadCount(data.count);
			} catch (error) {
				console.error("Refresh unread notifications count error:", error);
			}
		};

		const fetchNotifications = async () => {
			setLoadingNotifications(true);

			try {
				const response = await fetch(`${API_BASE_URL}/api/notifications`, {
					credentials: "include",
				});

				if (!response.ok) return;

				const data = await response.json();
				setNotifications(data.notifications);
			} catch (error) {
				console.error("Fetch notifications error:", error);
			} finally {
				setLoadingNotifications(false);
			}
		};

		fetchUnreadCount();
		fetchNotifications();
	}, [showNotifications]);

	useEffect(() => {
		if (!showNotifications) return;

		const handleClickOutside = (event) => {
			if (
				notificationRef.current &&
				!notificationRef.current.contains(event.target)
			) {
				setShowNotifications(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showNotifications]);

	const handleReadAllNotifications = async () => {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/notifications/read-all`,
				{
					method: "PATCH",
					credentials: "include",
				},
			);

			if (!response.ok) return;

			setNotifications((prev) =>
				prev.map((notification) => ({
					...notification,
					is_read: true,
				})),
			);

			setUnreadCount(0);
		} catch (error) {
			console.error("Mark all notifications as read error:", error);
		}
	};

	const handleNotificationClick = async (notification) => {
		try {
			if (!notification.is_read) {
				const response = await fetch(
					`${API_BASE_URL}/api/notifications/${notification.id}/read`,
					{
						method: "PATCH",
						credentials: "include",
					},
				);

				if (!response.ok) return;

				setNotifications((prev) =>
					prev.map((item) =>
						item.id === notification.id ? { ...item, is_read: true } : item,
					),
				);

				setUnreadCount((prev) => Math.max(0, prev - 1));
			}

			setShowNotifications(false);

			if (notification.issue_id) {
				const basePath = isManager
					? "/manager/issues"
					: isExpert
						? "/expert/issues"
						: "/student/issues";

				navigate(`${basePath}/${notification.issue_id}`);
			}
		} catch (error) {
			console.error("Notification click error:", error);
		}
	};

	const mobileMenuItems = isManager
		? [
				{ label: "خانه", id: "dashboard", icon: LayoutDashboard },
				{ label: "درخواست‌ها", id: "issues", icon: ClipboardList },
				{ label: "گزارش‌ها", id: "reports", icon: BarChart3 },
				{ label: "اطلاعیه‌ها", id: "announcements", icon: Megaphone },
			]
		: isExpert
			? [
					{ label: "خانه", id: "dashboard", icon: LayoutDashboard },
					{ label: "درخواست‌ها", id: "issues", icon: ClipboardList },
					{ label: "گزارش‌ها", id: "reports", icon: BarChart3 },
					{ label: "اطلاعیه‌ها", id: "announcements", icon: Megaphone },
				]
			: [
					{ label: "خانه", id: "dashboard", icon: LayoutDashboard },
					{ label: "ثبت مشکل", id: "create", icon: PlusCircle },
					{ label: "مشکلات من", id: "issues", icon: ClipboardList },
					{ label: "اطلاعیه‌ها", id: "announcements", icon: Megaphone },
				];

	return (
		<div className="dashboard-layout" dir="rtl">
			<aside className="dashboard-sidebar">
				<div className="sidebar-brand">
					<div className="brand-logo">د</div>
					<div>
						<h2>دانشگاه</h2>
						<span>سامانه مدیریت مشکلات</span>
					</div>
				</div>

				<div className="sidebar-divider" />

				<div className="sidebar-user">
					<div className="sidebar-avatar">
						<UserRound size={21} />
					</div>
					<div className="sidebar-user-info">
						<strong>{user?.full_name || "کاربر دانشگاه"}</strong>
						<span>{roleLabel}</span>
					</div>
				</div>

				<span className="sidebar-section-title">منوی اصلی</span>

				<nav className="sidebar-menu">
					{menuItems.map((item) => {
						const Icon = item.icon;
						const isActive = activeItem === item.id;

						return (
							<button
								key={item.id}
								className={`sidebar-menu-item ${isActive ? "active" : ""}`}
								type="button"
								onClick={() => {
									if (routes[item.id]) navigateTo(routes[item.id]);
								}}
							>
								<Icon size={19} strokeWidth={1.8} />
								<span>{item.label}</span>
								<ChevronLeft className="menu-chevron" size={15} />
							</button>
						);
					})}
				</nav>

				<div className="sidebar-bottom">
					<button
						className={`sidebar-menu-item ${activeItem === "settings" ? "active" : ""}`}
						type="button"
						onClick={() => navigateTo("/settings")}
					>
						<Settings size={19} />
						<span>تنظیمات</span>
						<ChevronLeft className="menu-chevron" size={15} />
					</button>

					<button
						className="sidebar-menu-item logout-button"
						type="button"
						onClick={handleLogout}
					>
						<LogOut size={19} />
						<span>خروج از حساب</span>
					</button>

					<div className="sidebar-footer">
						سامانه هوشمند مدیریت مشکلات دانشگاه
						<span>نسخه ۱.۰.۰</span>
					</div>
				</div>
			</aside>

			<div className="dashboard-main">
				<header className="dashboard-header">
					<div className="header-university">
						<div className="header-university-logo">د</div>
						<div>
							<strong>سامانه هوشمند دانشگاه</strong>
							<span>مدیریت و پیگیری مشکلات محیط دانشگاه</span>
						</div>
					</div>


					<div className="header-actions">
						<div className="notification-wrapper" ref={notificationRef}>
							<button
								className="header-icon-button"
								type="button"
								aria-label="اعلان‌ها"
								onClick={() => setShowNotifications((prev) => !prev)}
							>
								<Bell size={20} />

								{unreadCount > 0 && (
									<span className="notification-dot">
										{unreadCount > 99 ? "99+" : unreadCount}
									</span>
								)}
							</button>

							{showNotifications && (
								<div className="notifications-dropdown">
									<div className="notifications-header">
										<strong>اعلان‌ها</strong>

										{unreadCount > 0 && (
											<button
												type="button"
												onClick={handleReadAllNotifications}
											>
												خواندن همه
											</button>
										)}
									</div>

									<div className="notifications-list">
										{loadingNotifications ? (
											<div className="notifications-empty">
												در حال دریافت اعلان‌ها...
											</div>
										) : notifications.length === 0 ? (
											<div className="notifications-empty">
												<Bell size={28} />
												<strong>هنوز اعلانی ندارید</strong>
												<span>
													در صورت ثبت اتفاقات جدید، اعلان‌های شما اینجا نمایش
													داده می‌شوند.
												</span>
											</div>
										) : (
											notifications.map((notification) => (
												<div
													key={notification.id}
													className={`notification-item ${
														!notification.is_read ? "unread" : ""
													}`}
													onClick={() => handleNotificationClick(notification)}
													role="button"
													tabIndex={0}
												>
													<strong>{notification.title}</strong>
													<p>{notification.message}</p>
													<span>
														{new Date(notification.created_at).toLocaleString(
															"fa-IR",
														)}
													</span>
												</div>
											))
										)}
									</div>
								</div>
							)}
						</div>

						<div className="header-profile-wrapper">
							<div
								className="header-profile"
								role="button"
								tabIndex={0}
								onClick={() =>
									setMobileMenu((prev) =>
										prev === "profile" ? null : "profile",
									)
								}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										setMobileMenu((prev) =>
											prev === "profile" ? null : "profile",
										);
									}
								}}
							>
								<div className="header-avatar">
									<UserRound size={19} />
								</div>
								<div>
									<strong>{user?.full_name || "کاربر دانشگاه"}</strong>
									<span>{roleLabel}</span>
								</div>
							</div>

							{mobileMenu === "profile" && (
								<div className="mobile-quick-menu">
									<button type="button" onClick={() => navigateTo("/settings")}>
										<Settings size={18} />
										تنظیمات
									</button>
									<button type="button" onClick={handleLogout}>
										<LogOut size={18} />
										خروج از حساب
									</button>
								</div>
							)}
						</div>
					</div>
				</header>

				<main className="dashboard-content">{children}</main>
			</div>

			<nav className="mobile-bottom-nav">
				{mobileMenuItems.map((item) => {
					const Icon = item.icon;
					const isActive =
						activeItem === item.id &&
						mobileMenu !== "management" &&
						mobileMenu !== "more";

					return (
						<button
							key={item.id}
							type="button"
							className={`mobile-nav-item ${isActive ? "active" : ""}`}
							onClick={() => navigateTo(routes[item.id])}
						>
							<Icon size={21} />
							<span>{item.label}</span>
						</button>
					);
				})}

				{isManager && (
					<>
						<div className="mobile-nav-menu-wrapper">
							{mobileMenu === "management" && (
								<div className="mobile-quick-menu">
									<button
										type="button"
										onClick={() => navigateTo(routes.users)}
									>
										<Users size={18} />
										مدیریت کاربران
									</button>

									<button
										type="button"
										onClick={() => navigateTo(routes.departments)}
									>
										<Building2 size={18} />
										مدیریت واحدها
									</button>
								</div>
							)}

							<button
								type="button"
								className={`mobile-nav-item ${
									["users", "departments"].includes(activeItem) ||
									mobileMenu === "management"
										? "active"
										: ""
								}`}
								onClick={() =>
									setMobileMenu((prev) =>
										prev === "management" ? null : "management",
									)
								}
							>
								<Building2 size={21} />
								<span>مدیریت</span>
							</button>
						</div>
					</>
				)}
			</nav>
		</div>
	);
}

export default DashboardLayout;
