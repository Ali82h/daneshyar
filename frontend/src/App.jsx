
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
import API_BASE_URL from "./config";

function StudentDashboardRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user) {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			} else {
				alert("خروج از حساب انجام نشد.");
			}
		} catch (error) {
			console.error("Logout failed:", error);
			alert("ارتباط با سرور برقرار نشد.");
		}
	};

	const handleNavigate = (page) => {
		const paths = {
			create: "/student/issues/create",
			issues: "/student/issues",
			announcements: "/student/announcements",
		};

		if (paths[page]) {
			window.location.href = paths[page];
			return;
		}

		alert(`صفحه ${page} در مراحل بعدی پیاده‌سازی می‌شود.`);
	};

	return (
		<StudentDashboard
			user={user}
			onLogout={handleLogout}
			onNavigate={handleNavigate}
		/>
	);
}

function CreateIssueRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user) {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (user.role === "manager") {
		return <Navigate to="/manager/dashboard" replace />;
	}

	if (user.role === "expert") {
		return <Navigate to="/expert/dashboard" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	return <CreateIssue user={user} onLogout={handleLogout} />;
}

function MyIssuesRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user) {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return <MyIssues user={user} />;
}

function IssueDetailsRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user) {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	return <IssueDetails user={user} onLogout={handleLogout} />;
}

function PlaceholderPage({ title }) {
	return (
		<main style={{ padding: "40px", direction: "rtl" }}>
			<h1>{title}</h1>
			<p>این صفحه در مراحل بعدی پیاده‌سازی خواهد شد.</p>
			<Link to="/">بازگشت به صفحه اصلی</Link>
		</main>
	);
}

function ExpertDashboardRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user?.role === "expert") {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	return <ExpertDashboard user={user} onLogout={handleLogout} />;
}

function ExpertIssuesRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user?.role === "expert") {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	return <ExpertIssues user={user} onLogout={handleLogout} />;
}

function ExpertReportsRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user?.role === "expert") {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	return <ExpertReports user={user} onLogout={handleLogout} />;
}

function ManagerDashboardRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user?.role === "manager") {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	return <ManagerDashboard user={user} onLogout={handleLogout} />;
}

function ManagerReportsRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user?.role === "manager") {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			} else {
				alert("خروج از حساب انجام نشد.");
			}
		} catch (error) {
			console.error("Logout failed:", error);
			alert("ارتباط با سرور برقرار نشد.");
		}
	};

	return <ManagerReports user={user} onLogout={handleLogout} />;
}

function ManagerUsersRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user?.role === "manager") {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			} else {
				alert("خروج از حساب انجام نشد.");
			}
		} catch (error) {
			console.error("Logout failed:", error);
			alert("ارتباط با سرور برقرار نشد.");
		}
	};

	return <ManagerUsers user={user} onLogout={handleLogout} />;
}

function ManagerDepartmentsRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user?.role === "manager") {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			} else {
				alert("خروج از حساب انجام نشد.");
			}
		} catch (error) {
			console.error("Logout failed:", error);
			alert("ارتباط با سرور برقرار نشد.");
		}
	};

	return <ManagerDepartments user={user} onLogout={handleLogout} />;
}

function ManagerIssuesRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user?.role === "manager") {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	return <ManagerIssues user={user} onLogout={handleLogout} />;
}

function AnnouncementsRoute({ role }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user?.role === role) {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, [role]);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			} else {
				alert("خروج از حساب انجام نشد.");
			}
		} catch (error) {
			console.error("Logout failed:", error);
			alert("ارتباط با سرور برقرار نشد.");
		}
	};

	return <Announcements user={user} onLogout={handleLogout} />;
}

function SettingsRoute() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
					credentials: "include",
				});

				const data = await response.json();

				if (response.ok && data.user) {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Session check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	if (loading) {
		return (
			<p style={{ direction: "rtl", padding: "30px" }}>در حال بررسی ورود...</p>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const handleLogout = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	return <Settings user={user} onLogout={handleLogout} />;
}

function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />

			<Route path="/login" element={<Login />} />

			<Route path="/register" element={<Register />} />

			<Route path="/student/dashboard" element={<StudentDashboardRoute />} />
			<Route path="/student/issues" element={<MyIssuesRoute />} />
			<Route
				path="/student/announcements"
				element={<AnnouncementsRoute role="student" />}
			/>

			<Route path="/manager/dashboard" element={<ManagerDashboardRoute />} />
			<Route path="/manager/reports" element={<ManagerReportsRoute />} />
			<Route path="/manager/issues" element={<ManagerIssuesRoute />} />
			<Route path="/manager/users" element={<ManagerUsersRoute />} />
			<Route
				path="/manager/announcements"
				element={<AnnouncementsRoute role="manager" />}
			/>
			<Route
				path="/manager/departments"
				element={<ManagerDepartmentsRoute />}
			/>

			<Route path="/expert/dashboard" element={<ExpertDashboardRoute />} />
			<Route path="/expert/issues" element={<ExpertIssuesRoute />} />
			<Route path="/expert/reports" element={<ExpertReportsRoute />} />

			<Route path="*" element={<PlaceholderPage title="صفحه پیدا نشد" />} />
			<Route path="/student/issues/create" element={<CreateIssueRoute />} />
			<Route path="/student/issues/:id" element={<IssueDetailsRoute />} />
			<Route path="/manager/issues/:id" element={<IssueDetailsRoute />} />

			<Route path="/expert/issues/:id" element={<IssueDetailsRoute />} />
			<Route
				path="/expert/announcements"
				element={<AnnouncementsRoute role="expert" />}
			/>

			<Route path="/settings" element={<SettingsRoute />} />
		</Routes>
	);
}

export default App;
