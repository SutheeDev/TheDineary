import { useNavigate, useLocation } from "react-router-dom";
import { RestaurantForm } from "../components";
import apiClient from "../utils/apiClient";
import { useGlobalContext } from "../App";

const initialState = {
  name: "",
  cuisine: "",
  visitDate: "",
  ratings: { food: 0, service: 0, ambience: 0, value: 0 },
  notes: { food: "", service: "", ambience: "", value: "" },
  dishes: [],
  review: "",
  priceRange: "",
  category: "",
  images: [],
  location: null,
  google: null,
};

const CreateRestaurant = () => {
  const { state } = useLocation();
  const { setRestaurants, showToast } = useGlobalContext();
  const navigate = useNavigate();

  // When opened from the map's "Add this restaurant" flow, the picked place is
  // passed in router state; seed the form with it. Direct visits start blank.
  const initialValue = { ...initialState, ...(state?.prefill || {}) };

  const handleSubmit = async (payload) => {
    const response = await apiClient.post("/restaurants", payload);
    const newRestaurant = response.data;
    setRestaurants((prev) =>
      [...prev, newRestaurant].sort(
        (a, b) => new Date(b.visitDate) - new Date(a.visitDate)
      )
    );
    showToast("Restaurant saved", "success");
    // Return to the map when the add started there so the new pin shows up;
    // otherwise go to the Home list as before.
    navigate(state?.from === "map" ? "/map" : "/");
  };

  return (
    <RestaurantForm
      heading="Create Entry"
      submitLabel="Save Entry"
      initialValue={initialValue}
      onSubmit={handleSubmit}
      showPlaceSearch
    />
  );
};
export default CreateRestaurant;
