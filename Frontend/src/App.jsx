import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  Home,
  Error,
  CreateRestaurant,
  Restaurant,
  UpdateRestaurant,
  UpdateUser,
  DashboardLayout,
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  RestaurantsMap,
  Ranking,
  Calendar,
  Dashboard,
} from "./pages/index";
import { Toast } from "./components";
import apiClient from "./utils/apiClient";

const globalContext = createContext();

const App = () => {
  const [user, setUser] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [isAlert, setIsAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message, type = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    }
    setUser(null);
    setRestaurants([]);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: userData } = await apiClient.get("/auth/me");
        setUser(userData);
        const { data: restaurantsData } = await apiClient.get("/restaurants");
        setRestaurants(restaurantsData);
      } catch {
        // 401 is handled by the apiClient interceptor
      } finally {
        setIsLoading(false);
        setIsAuthChecked(true);
      }
    };

    init();
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <globalContext.Provider
        value={{
        user,
        setUser,
        restaurants,
        setRestaurants,
        isAlert,
        setIsAlert,
        isLoading,
        logout,
        isAuthChecked,
        toasts,
        showToast,
        removeToast,
      }}
    >
      <Toast />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="/create" element={<CreateRestaurant />} />
            <Route path="/map" element={<RestaurantsMap />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/restaurant/update/:id"
              element={<UpdateRestaurant />}
            />
            <Route path="/user/update" element={<UpdateUser />} />
          </Route>
          <Route path="/restaurant/:id" element={<ProtectedRoute><Restaurant /></ProtectedRoute>} />
          <Route path="*" element={<Error />} />
        </Routes>
      </BrowserRouter>
      </globalContext.Provider>
    </GoogleOAuthProvider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, isAuthChecked } = useGlobalContext();
  if (!isAuthChecked) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export const useGlobalContext = () => useContext(globalContext);
export default App;
