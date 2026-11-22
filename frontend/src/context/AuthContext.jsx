
import {
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";

import API_BASE_URL from "../config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const checkSession = async () => {
			try {
				const response = await fetch(
					`${API_BASE_URL}/api/auth/me`,
					{
						credentials: "include",
					}
				);

				const data = await response.json();

				if (!isMounted) return;

				if (response.ok && data.user) {
					setUser(data.user);
				} else {
					setUser(null);
				}
			} catch (error) {
				console.error("Session check failed:", error);

				if (isMounted) {
					setUser(null);
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		checkSession();

		return () => {
			isMounted = false;
		};
	}, []);

	const logout = async () => {
		try {
			await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
		} catch (error) {
			console.error("Logout failed:", error);
		} finally {
			setUser(null);
		}
	};

	const value = {
		user,
		setUser,
		loading,
		logout,
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error(
			"useAuth must be used inside AuthProvider"
		);
	}

	return context;
}
