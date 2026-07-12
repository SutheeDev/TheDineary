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

// A Google Money value is { currencyCode, units (whole), nanos (10^-9 parts) }.
// Turn it into a plain number amount.
const moneyAmount = (m) => (m ? m.units + (m.nanos || 0) / 1e9 : undefined);

// The simple boolean attributes we read off a Place, mapped from the SDK's
// property name to the shorter canonical key we store.
const SIMPLE_ATTRS = {
  hasDineIn: "dineIn",
  hasTakeout: "takeout",
  hasDelivery: "delivery",
  hasCurbsidePickup: "curbsidePickup",
  isReservable: "reservable",
  hasOutdoorSeating: "outdoorSeating",
  hasRestroom: "restroom",
  servesBreakfast: "servesBreakfast",
  servesLunch: "servesLunch",
  servesDinner: "servesDinner",
  servesBrunch: "servesBrunch",
  servesVegetarianFood: "servesVegetarianFood",
  servesBeer: "servesBeer",
  servesWine: "servesWine",
  servesCocktails: "servesCocktails",
  servesCoffee: "servesCoffee",
  servesDessert: "servesDessert",
  isGoodForChildren: "goodForChildren",
  hasMenuForChildren: "menuForChildren",
  isGoodForGroups: "goodForGroups",
  isGoodForWatchingSports: "goodForWatchingSports",
  allowsDogs: "allowsDogs",
  hasLiveMusic: "liveMusic",
};

// The nested attribute objects and the sub-booleans we read off each. These
// keep their descriptive names (used as-is when displaying).
const OPTION_ATTRS = {
  accessibilityOptions: [
    "hasWheelchairAccessibleEntrance",
    "hasWheelchairAccessibleParking",
    "hasWheelchairAccessibleRestroom",
    "hasWheelchairAccessibleSeating",
  ],
  parkingOptions: [
    "hasFreeGarageParking",
    "hasFreeParkingLot",
    "hasFreeStreetParking",
    "hasPaidGarageParking",
    "hasPaidParkingLot",
    "hasPaidStreetParking",
    "hasValetParking",
  ],
  paymentOptions: [
    "acceptsCashOnly",
    "acceptsCreditCards",
    "acceptsDebitCards",
    "acceptsNFC",
  ],
};

// Collect only the attributes that came back true into one flat bag, so the
// stored doc stays compact and the detail page just renders what is present.
const buildAttributes = (place) => {
  const attrs = {};
  for (const [prop, key] of Object.entries(SIMPLE_ATTRS)) {
    if (place[prop] === true) attrs[key] = true;
  }
  for (const [objName, subKeys] of Object.entries(OPTION_ATTRS)) {
    const obj = place[objName];
    if (!obj) continue;
    for (const subKey of subKeys) {
      if (obj[subKey] === true) attrs[subKey] = true;
    }
  }
  return attrs;
};

// Google Places (New) returns addressComponents as a list of parts, each with
// a `types` array plus `longText`/`shortText`. Pull them apart into the
// separate labelled fields we show (built to work for any country, so fields a
// country lacks -- like a state or postal code -- just come back empty).
const parseAddressComponents = (components) => {
  const result = { line1: "", city: "", state: "", postalCode: "", country: "" };
  if (!components) return result;

  const find = (type) =>
    components.find((c) => c.types?.includes(type));

  const streetNumber = find("street_number")?.longText || "";
  const route = find("route")?.longText || "";
  result.line1 = [streetNumber, route].filter(Boolean).join(" ");

  const cityPart =
    find("locality") ||
    find("postal_town") ||
    find("sublocality_level_1") ||
    find("administrative_area_level_2");
  result.city = cityPart?.longText || "";

  result.state = find("administrative_area_level_1")?.longText || "";
  result.postalCode = find("postal_code")?.longText || "";
  result.country = find("country")?.longText || "";

  return result;
};

// Mounts Google's Places autocomplete web component. When the user picks a
// place it fetches the details once and hands the caller a normalized object
// ({ name, cuisine, priceRange, location }). The element manages its own
// billing session token, so the linked Place Details lookup stays in the free
// tier. If VITE_GOOGLE_MAPS_API_KEY is blank it renders nothing.
const PlaceSearch = ({ onSelect, className, clearOnSelect, hideClearButton }) => {
  const searchRef = useRef(null);

  // Keep the latest onSelect in a ref so the mount effect can stay [] (mount
  // once) while still calling the caller's current callback.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const clearOnSelectRef = useRef(clearOnSelect);
  clearOnSelectRef.current = clearOnSelect;

  const hideClearButtonRef = useRef(hideClearButton);
  hideClearButtonRef.current = hideClearButton;

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
          "addressComponents",
          "location",
          "id",
          // H9: richer read-only data shown on the detail page.
          "regularOpeningHours",
          "websiteURI",
          "priceRange",
          ...Object.keys(SIMPLE_ATTRS),
          ...Object.keys(OPTION_ATTRS),
        ],
      });

      const parts = parseAddressComponents(place.addressComponents);

      // Build the read-only Google blob. Any of these may be missing for a
      // given place, so include it only when at least one piece has data.
      const hours = place.regularOpeningHours?.weekdayDescriptions || [];
      const website = place.websiteURI || "";
      const pr = place.priceRange;
      const priceRange = pr
        ? {
            startPrice: moneyAmount(pr.startPrice),
            endPrice: moneyAmount(pr.endPrice),
            currency:
              pr.startPrice?.currencyCode || pr.endPrice?.currencyCode || "",
          }
        : undefined;
      const attributes = buildAttributes(place);

      const hasGoogleData =
        hours.length > 0 ||
        website ||
        priceRange ||
        Object.keys(attributes).length > 0;
      const google = hasGoogleData
        ? { hours, website, priceRange, attributes }
        : null;

      onSelectRef.current({
        name: place.displayName || "",
        cuisine: formatCuisine(place.primaryType),
        priceRange: mapPriceLevel(place.priceLevel),
        location: {
          address: place.formattedAddress || "",
          lat: place.location?.lat(),
          lng: place.location?.lng(),
          placeId: place.id,
          ...parts,
        },
        google,
      });

      if (clearOnSelectRef.current && autocompleteEl) {
        try {
          autocompleteEl.value = null;
        } catch {
          // Some versions of the widget don't allow clearing the text; ignore.
        }
      }
    };

    loader.importLibrary("places").then(({ PlaceAutocompleteElement }) => {
      // The effect may have been torn down (e.g. React StrictMode's
      // double-invoke in dev) before this async import resolved; bail out so
      // we don't append a second, orphaned autocomplete box.
      if (cancelled || !searchRef.current) return;

      // The widget's built-in "clear" (x) button lives in a closed shadow root
      // and is not exposed as a ::part, so it can't be styled from outside. To
      // hide it we briefly force *only this element's* shadow root to open mode
      // while it mounts, then inject a rule into that shadow root. The guard
      // (this === autocompleteEl) keeps every other component's shadow closed.
      let restoreAttachShadow;
      if (hideClearButtonRef.current) {
        const origAttachShadow = Element.prototype.attachShadow;
        Element.prototype.attachShadow = function (init) {
          const opts = this === autocompleteEl ? { ...init, mode: "open" } : init;
          return origAttachShadow.call(this, opts);
        };
        restoreAttachShadow = () => {
          Element.prototype.attachShadow = origAttachShadow;
        };
      }

      autocompleteEl = new PlaceAutocompleteElement();
      autocompleteEl.className = "place-autocomplete";
      searchRef.current.appendChild(autocompleteEl);
      autocompleteEl.addEventListener("gmp-select", handlePlaceSelect);

      if (hideClearButtonRef.current) {
        // The shadow root attaches asynchronously after the element connects,
        // so poll briefly until it exists, inject the hide rule, then restore
        // the original attachShadow.
        let tries = 0;
        const injectHide = () => {
          if (autocompleteEl?.shadowRoot) {
            const style = document.createElement("style");
            style.textContent = ".clear-button { display: none; }";
            autocompleteEl.shadowRoot.appendChild(style);
            restoreAttachShadow();
          } else if (tries++ < 20) {
            setTimeout(injectHide, 25);
          } else {
            restoreAttachShadow();
          }
        };
        injectHide();
      }
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
