import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Home,
  Error,
  CreateRestaurant,
  Restaurant,
  UpdateRestaurant,
  UpdateUser,
  DashboardLayout,
} from "./pages/index";
import apiClient from "./utils/apiClient";

const userId = import.meta.env.VITE_USER_ID;
const globalContext = createContext();

const App = () => {
  const [user, setUser] = useState({});
  const [restaurants, setRestaurants] = useState([]);
  const [isAlert, setIsAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getUser = async () => {
    try {
      const response = await apiClient.get(`/user/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getRestaurants = async () => {
    try {
      const response = await apiClient.get(`/restaurants/${userId}`);
      setRestaurants(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const loadingPage = async () => {
      try {
        setIsLoading(true);
        await getUser();
        await getRestaurants();
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    };

    loadingPage();
  }, []);

  return (
    <globalContext.Provider
      value={{
        user,
        setUser,
        restaurants,
        setRestaurants,
        isAlert,
        setIsAlert,
        isLoading,
        setIsLoading,
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="/create" element={<CreateRestaurant />} />
            <Route
              path="/restaurant/update/:id"
              element={<UpdateRestaurant />}
            />
            <Route path="/user/update" element={<UpdateUser />} />
          </Route>
          <Route path="/restaurant/:id" element={<Restaurant />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </BrowserRouter>
    </globalContext.Provider>
  );
};
export const useGlobalContext = () => useContext(globalContext);
export default App;
