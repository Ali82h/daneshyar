import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import StudentDashboard from "./pages/StudentDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateIssue from "./pages/CreateIssue";
import MyIssues from "./pages/MyIssues";
import IssueDetails from "./pages/IssueDetails";
import ExpertDashboard from "./pages/ExpertDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerReports from "./pages/ManagerReports";
import ManagerIssues from "./pages/ManagerIssues";
import ManagerUsers from "./pages/ManagerUsers";
import ManagerDepartments from "./pages/ManagerDepartments";
import ExpertIssues from "./pages/ExpertIssues";
import ExpertReports from "./pages/ExpertReports";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Announcements from "./pages/Announcements";

const dashboardPaths = {
	student: "/student/dashboard",
	manager: "/manager/dashboard",
	expert: "/expert/dashboard",
};

// محافظت از صفحات و بررسی نقش کاربر
function ProtectedRoute({ roles, children }) {
	const { user, loading, logout } = useAuth();
	const navigate = useNavigate();

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (roles && !roles.includes(user.role)) {
		return <Navigate to={dashboardPaths[user.role] || "/"} replace />;
	}

	const handleLogout = async () => {
		navigate("/", { replace: true });
		await logout();
	};

	return children({
		user,
		onLogout: handleLogout,
	});
}

// داشبورد دانشجو
function StudentDashboardRoute() {
	const navigate = useNavigate();

	return (
		<ProtectedRoute roles={["student"]}>
			{({ user, onLogout }) => (
				<StudentDashboard
					user={user}
					onLogout={onLogout}
					onNavigate={(page) => {
						const paths = {
							create: "/student/issues/create",
							issues: "/student/issues",
							announcements: "/student/announcements",
						};

						if (paths[page]) {
							navigate(paths[page]);
						} else {
							alert(`صفحه ${page} در مراحل بعدی پیاده‌سازی می‌شود.`);
						}
					}}
				/>
			)}
		</ProtectedRoute>
	);
}

// ثبت مشکل
function CreateIssueRoute() {
	return (
		<ProtectedRoute roles={["student"]}>
			{({ user, onLogout }) => <CreateIssue user={user} onLogout={onLogout} />}
		</ProtectedRoute>
	);
}

// مشکلات من
function MyIssuesRoute() {
	return (
		<ProtectedRoute roles={["student"]}>
			{({ user }) => <MyIssues user={user} />}
		</ProtectedRoute>
	);
}

// جزئیات مشکل
function IssueDetailsRoute() {
	return (
		<ProtectedRoute roles={["student", "manager", "expert"]}>
			{({ user, onLogout }) => <IssueDetails user={user} onLogout={onLogout} />}
		</ProtectedRoute>
	);
}

// داشبورد کارشناس
function ExpertDashboardRoute() {
	return (
		<ProtectedRoute roles={["expert"]}>
			{({ user, onLogout }) => (
				<ExpertDashboard user={user} onLogout={onLogout} />
			)}
		</ProtectedRoute>
	);
}

// مشکلات کارشناس
function ExpertIssuesRoute() {
	return (
		<ProtectedRoute roles={["expert"]}>
			{({ user, onLogout }) => <ExpertIssues user={user} onLogout={onLogout} />}
		</ProtectedRoute>
	);
}

// گزارش‌های کارشناس
function ExpertReportsRoute() {
	return (
		<ProtectedRoute roles={["expert"]}>
			{({ user, onLogout }) => (
				<ExpertReports user={user} onLogout={onLogout} />
			)}
		</ProtectedRoute>
	);
}

// داشبورد مدیر
function ManagerDashboardRoute() {
	return (
		<ProtectedRoute roles={["manager"]}>
			{({ user, onLogout }) => (
				<ManagerDashboard user={user} onLogout={onLogout} />
			)}
		</ProtectedRoute>
	);
}

// گزارش‌های مدیر
function ManagerReportsRoute() {
	return (
		<ProtectedRoute roles={["manager"]}>
			{({ user, onLogout }) => (
				<ManagerReports user={user} onLogout={onLogout} />
			)}
		</ProtectedRoute>
	);
}

// مدیریت کاربران
function ManagerUsersRoute() {
	return (
		<ProtectedRoute roles={["manager"]}>
			{({ user, onLogout }) => <ManagerUsers user={user} onLogout={onLogout} />}
		</ProtectedRoute>
	);
}

// مدیریت دانشکده‌ها و دپارتمان‌ها
function ManagerDepartmentsRoute() {
	return (
		<ProtectedRoute roles={["manager"]}>
			{({ user, onLogout }) => (
				<ManagerDepartments user={user} onLogout={onLogout} />
			)}
		</ProtectedRoute>
	);
}

// مشکلات مدیر
function ManagerIssuesRoute() {
	return (
		<ProtectedRoute roles={["manager"]}>
			{({ user, onLogout }) => (
				<ManagerIssues user={user} onLogout={onLogout} />
			)}
		</ProtectedRoute>
	);
}

// اطلاعیه‌ها
function AnnouncementsRoute({ role }) {
	return (
		<ProtectedRoute roles={[role]}>
			{({ user, onLogout }) => (
				<Announcements user={user} onLogout={onLogout} />
			)}
		</ProtectedRoute>
	);
}

// تنظیمات
function SettingsRoute() {
	return (
		<ProtectedRoute roles={["student", "manager", "expert"]}>
			{({ user, onLogout }) => <Settings user={user} onLogout={onLogout} />}
		</ProtectedRoute>
	);
}

// صفحه موقت
function PlaceholderPage({ title }) {
	return (
		<main style={{ padding: "40px", direction: "rtl" }}>
			<h1>{title}</h1>
			<p>این صفحه در مراحل بعدی پیاده‌سازی خواهد شد.</p>
			<Link to="/">بازگشت به صفحه اصلی</Link>
		</main>
	);
}

function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />

			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />

			<Route path="/student/dashboard" element={<StudentDashboardRoute />} />
			<Route path="/student/issues" element={<MyIssuesRoute />} />
			<Route path="/student/issues/create" element={<CreateIssueRoute />} />
			<Route path="/student/issues/:id" element={<IssueDetailsRoute />} />
			<Route
				path="/student/announcements"
				element={<AnnouncementsRoute role="student" />}
			/>

			<Route path="/manager/dashboard" element={<ManagerDashboardRoute />} />
			<Route path="/manager/reports" element={<ManagerReportsRoute />} />
			<Route path="/manager/issues" element={<ManagerIssuesRoute />} />
			<Route path="/manager/issues/:id" element={<IssueDetailsRoute />} />
			<Route path="/manager/users" element={<ManagerUsersRoute />} />
			<Route
				path="/manager/departments"
				element={<ManagerDepartmentsRoute />}
			/>
			<Route
				path="/manager/announcements"
				element={<AnnouncementsRoute role="manager" />}
			/>

			<Route path="/expert/dashboard" element={<ExpertDashboardRoute />} />
			<Route path="/expert/issues" element={<ExpertIssuesRoute />} />
			<Route path="/expert/issues/:id" element={<IssueDetailsRoute />} />
			<Route path="/expert/reports" element={<ExpertReportsRoute />} />
			<Route
				path="/expert/announcements"
				element={<AnnouncementsRoute role="expert" />}
			/>

			<Route path="/settings" element={<SettingsRoute />} />

			<Route path="*" element={<PlaceholderPage title="صفحه پیدا نشد" />} />
		</Routes>
	);
}

export default App;
