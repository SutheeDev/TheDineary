import axios from "axios";

const apiClient = axios.create({
  // baseURL: "https://perscholascapstone.onrender.com/api",
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
