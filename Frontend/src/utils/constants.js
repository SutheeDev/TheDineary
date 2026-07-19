import {
  FaHamburger,
  FaPizzaSlice,
  FaFish,
  FaLeaf,
  FaWineGlassAlt,
  FaBreadSlice,
  FaIceCream,
  FaCoffee,
  FaDrumstickBite,
  FaUtensils,
  FaFireAlt,
} from "react-icons/fa";
import { GiNoodles, GiCupcake, GiChopsticks, GiFullPizza } from "react-icons/gi";

// Shown wherever a restaurant has no photo of its own.
export const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dnc7potxo/image/upload/v1738184597/DineDiary/placeholder-image.png";

// Cuisine (or category) name -> an icon that fits it. Keys are lowercased on
// lookup, so "Thai", "thai" and Google's "Thai" all match. Values are react-icon
// components; render as <Icon />. Cuisines not listed fall back to a generic
// utensils icon via getCuisineIcon().
const CUISINE_ICONS = {
  american: FaHamburger,
  burger: FaHamburger,
  pizza: FaPizzaSlice,
  italian: GiFullPizza,
  japanese: GiChopsticks,
  sushi: GiChopsticks,
  ramen: GiNoodles,
  chinese: GiNoodles,
  thai: GiNoodles,
  vietnamese: GiNoodles,
  korean: GiNoodles,
  noodles: GiNoodles,
  seafood: FaFish,
  vegetarian: FaLeaf,
  vegan: FaLeaf,
  mediterranean: FaLeaf,
  greek: FaLeaf,
  steakhouse: FaDrumstickBite,
  bbq: FaFireAlt,
  "middle eastern": FaDrumstickBite,
  turkish: FaDrumstickBite,
  indian: FaFireAlt,
  mexican: FaFireAlt,
  spanish: FaWineGlassAlt,
  french: FaWineGlassAlt,
  bar: FaWineGlassAlt,
  bakery: FaBreadSlice,
  "bakery / pastry": FaBreadSlice,
  dessert: FaIceCream,
  cupcake: GiCupcake,
  "coffee shop": FaCoffee,
  coffee: FaCoffee,
  cafe: FaCoffee,
};

// Return the icon component for a cuisine or category string. Always returns a
// component (a generic utensils icon when there is no specific match).
export const getCuisineIcon = (value) => {
  if (!value) return FaUtensils;
  return CUISINE_ICONS[value.trim().toLowerCase()] || FaUtensils;
};

// Starter suggestions for the cuisine box. It is a suggest-as-you-type list, not
// a fixed set: users can still type any cuisine that is not here. The labels are
// title-cased to match what the Google Places auto-fill produces, so a hand-typed
// entry and a Google one land on the same value.
export const CUISINES = [
  "American",
  "Chinese",
  "French",
  "Greek",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Pizza",
  "Seafood",
  "Spanish",
  "Steakhouse",
  "Sushi",
  "Thai",
  "Turkish",
  "Vegetarian",
  "Vietnamese",
];

// Sentinel a filter sends to match entries that have no value for a field, so
// blank entries stay findable. The backend maps it to "missing or empty".
export const NO_VALUE = "__none__";

// The four price tiers, low to high.
export const PRICE_OPTIONS = ["$", "$$", "$$$", "$$$$"];

// The fixed "type of place" tags (separate from cuisine).
export const CATEGORY_OPTIONS = [
  "Restaurant",
  "Coffee Shop",
  "Bakery / Pastry",
  "Bar",
  "Dessert",
  "Street Food",
  "Other",
];

// The four rating categories that average into the final score.
export const CATEGORIES = [
  { key: "food", label: "Food" },
  { key: "service", label: "Service" },
  { key: "ambience", label: "Ambience" },
  { key: "value", label: "Value" },
];
