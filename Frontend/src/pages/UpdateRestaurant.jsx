import { useParams, useNavigate, Navigate } from "react-router-dom";
import { RestaurantForm, Loading } from "../components";
import { useGlobalContext } from "../App";
import apiClient from "../utils/apiClient";

const UpdateRestaurant = () => {
  const { restaurants, setRestaurants, isLoading, showToast } =
    useGlobalContext();
  const { id } = useParams();
  const navigate = useNavigate();

  const restaurant = restaurants.find((res) => res._id === id);

  // Guard against a missing entry: show the loader while the global list may
  // still be loading, and once loading is done and it is truly not found, go
  // back Home instead of crashing on the field reads below.
  if (!restaurant) {
    return isLoading ? <Loading /> : <Navigate to="/" replace />;
  }

  // Load the saved images, falling back to the legacy single `image` field for
  // entries created before multi-image support.
  const initialImages = (
    restaurant.images?.length
      ? restaurant.images
      : restaurant.image
      ? [{ url: restaurant.image }]
      : []
  ).map((img) => ({
    url: img.url,
    publicId: img.publicId || "",
    caption: img.caption || "",
  }));

  const initialValue = {
    name: restaurant.name,
    cuisine: restaurant.cuisine || "",
    visitDate: restaurant.visitDate,
    ratings: {
      food: restaurant.ratings?.food || 0,
      service: restaurant.ratings?.service || 0,
      ambience: restaurant.ratings?.ambience || 0,
      value: restaurant.ratings?.value || 0,
    },
    notes: {
      food: restaurant.notes?.food || "",
      service: restaurant.notes?.service || "",
      ambience: restaurant.notes?.ambience || "",
      value: restaurant.notes?.value || "",
    },
    dishes: (restaurant.dishes || []).map((dish) => ({
      name: dish.name || "",
      note: dish.note || "",
    })),
    review: restaurant.review || "",
    priceRange: restaurant.priceRange || 0,
    category: restaurant.category || "",
    images: initialImages,
  };

  const handleSubmit = async (payload) => {
    const response = await apiClient.patch(`/restaurants/${id}`, payload);
    const updatedRestaurant = response.data;
    setRestaurants(
      restaurants
        .map((res) => (res._id === id ? updatedRestaurant : res))
        .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
    );
    showToast("Changes saved", "success");
    navigate("/");
  };

  return (
    <RestaurantForm
      heading="Update Entry"
      submitLabel="Save Update"
      initialValue={initialValue}
      onSubmit={handleSubmit}
    />
  );
};
export default UpdateRestaurant;
