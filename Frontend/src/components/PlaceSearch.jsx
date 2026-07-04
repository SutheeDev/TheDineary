import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import styled from "styled-components";

// Google Places returns a primary type like "italian_restaurant"; turn it into
// a clean cuisine label like "Italian".
const formatCuisine = (primaryType) => {
  if (!primaryType) return "";
  return primaryType
    .replace(/_restaurant$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Google Places priceLevel enum -> our "$" string.
const PRICE_MAP = {
  INEXPENSIVE: "$",
  MODERATE: "$$",
  EXPENSIVE: "$$$",
  VERY_EXPENSIVE: "$$$$",
};

const mapPriceLevel = (priceLevel) => {
  if (!priceLevel) return "";
  return PRICE_MAP[priceLevel.replace(/^PRICE_LEVEL_/, "")] || "";
};

// Mounts Google's Places autocomplete web component. When the user picks a
// place it fetches the details once and hands the caller a normalized object
// ({ name, cuisine, priceRange, location }). The element manages its own
// billing session token, so the linked Place Details lookup stays in the free
// tier. If VITE_GOOGLE_MAPS_API_KEY is blank it renders nothing.
const PlaceSearch = ({ onSelect, className }) => {
  const searchRef = useRef(null);

  // Keep the latest onSelect in a ref so the mount effect can stay [] (mount
  // once) while still calling the caller's current callback.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !searchRef.current) return;

    const loader = new Loader({ apiKey, version: "weekly" });
    let autocompleteEl;
    let cancelled = false;

    const handlePlaceSelect = async ({ placePrediction }) => {
      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: [
          "displayName",
          "primaryType",
          "priceLevel",
          "formattedAddress",
          "location",
          "id",
        ],
      });

      onSelectRef.current({
        name: place.displayName || "",
        cuisine: formatCuisine(place.primaryType),
        priceRange: mapPriceLevel(place.priceLevel),
        location: {
          address: place.formattedAddress || "",
          lat: place.location?.lat(),
          lng: place.location?.lng(),
          placeId: place.id,
        },
      });
    };

    loader.importLibrary("places").then(({ PlaceAutocompleteElement }) => {
      // The effect may have been torn down (e.g. React StrictMode's
      // double-invoke in dev) before this async import resolved; bail out so
      // we don't append a second, orphaned autocomplete box.
      if (cancelled || !searchRef.current) return;
      autocompleteEl = new PlaceAutocompleteElement();
      autocompleteEl.className = "place-autocomplete";
      searchRef.current.appendChild(autocompleteEl);
      autocompleteEl.addEventListener("gmp-select", handlePlaceSelect);
    });

    return () => {
      cancelled = true;
      if (autocompleteEl) {
        autocompleteEl.removeEventListener("gmp-select", handlePlaceSelect);
        autocompleteEl.remove();
      }
    };
  }, []);

  return <Wrapper ref={searchRef} className={className} />;
};
export default PlaceSearch;

const Wrapper = styled.div`
  .place-autocomplete {
    width: 100%;
    border-radius: var(--form-radius);
    background-color: var(--bg-secondary-color);
    border: none;
    box-shadow: none;
    /* The widget defaults to a dark Material theme and ignores the --gmp-mat-*
       custom properties in this version. color-scheme: light plus the host box
       styles above are what actually theme it to match the app. */
    color-scheme: light;
  }

  /* It is a closed-shadow web component, so these exposed ::part() names are
     the only styling hooks. Strip the inner input's own background, border and
     focus ring so it shows the gray host box and matches the other inputs,
     which have no border or focus outline. */
  .place-autocomplete::part(input),
  .place-autocomplete::part(input-container) {
    background: transparent;
    border: none;
    outline: none;
    box-shadow: none;
  }

  .place-autocomplete::part(focus-ring) {
    display: none;
  }
`;
