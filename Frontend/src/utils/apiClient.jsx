import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Pages a signed-out visitor is meant to reach. The app's startup /auth/me call
// 401s for anyone not signed in, so without this list the interceptor would
// bounce them straight off these pages to /login.
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isPublic = PUBLIC_PATHS.some(
        (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
      );
      if (!isPublic) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
