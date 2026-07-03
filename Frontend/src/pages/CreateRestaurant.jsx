import { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Loader } from "@googlemaps/js-api-loader";
import { RateRangeEl, FormRow, Loading } from "../components";
import apiClient from "../utils/apiClient";
import { useGlobalContext } from "../App";

// Import Icons
import { TiStarFullOutline } from "react-icons/ti";
import { BiDollar } from "react-icons/bi";
import { BsUpload } from "react-icons/bs";

const initialState = {
  name: "",
  cuisine: "",
  visitDate: "",
  rating: 0,
  review: "",
  priceRange: "",
  location: null,
};

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

const CreateRestaurant = () => {
  const [entry, setEntry] = useState(initialState);

  const { setRestaurants, setIsLoading, isLoading } = useGlobalContext();

  const navigate = useNavigate();

  const searchRef = useRef(null);

  // Mount Google's Places autocomplete web component and auto-fill the form
  // when the user picks a place. The element manages its own billing session
  // token, so the linked Place Details lookup below stays in the free tier.
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

      setEntry((prev) => ({
        ...prev,
        name: place.displayName || prev.name,
        cuisine: formatCuisine(place.primaryType) || prev.cuisine,
        priceRange: mapPriceLevel(place.priceLevel) || prev.priceRange,
        location: {
          address: place.formattedAddress || "",
          lat: place.location?.lat(),
          lng: place.location?.lng(),
          placeId: place.id,
        },
      }));
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

  // Convert date into ISO format
  const handleDate = (date) => {
    const isoDate = date.toISOString();
    setEntry({ ...entry, visitDate: isoDate });
  };

  const handlePriceRange = (priceRange) => {
    // Convert number into a string of "$"
    let priceSymbol = "";
    for (let i = 0; i < priceRange; i++) {
      priceSymbol += "$";
    }
    setEntry({ ...entry, priceRange: priceSymbol });
  };

  const presetName = import.meta.env.VITE_UPLOAD_PRESET_NAME;
  const cloudName = import.meta.env.VITE_CLOUD_NAME;

  const uploadImage = async (file) => {
    // https://cloudinary.com/blog/guest_post/how-the-formdata-browser-api-works
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", presetName);
    formData.append("folder", "DineDiary");

    // Upload iamge to Cloudinary and get the image url back
    try {
      // https://cloudinary.com/documentation/image_upload_api_reference
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const data = response.data;
      return data.secure_url;
    } catch (error) {
      console.error(
        "Error uploading image:",
        error.response?.data || error.message
      );
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const imageUrl = await uploadImage(file);

    if (imageUrl) {
      setEntry({ ...entry, image: imageUrl });
    } else {
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, rating, visitDate } = entry;

    if (!name || !rating || !visitDate) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post("/restaurants", entry);
      const newRestaurant = response.data;
      setRestaurants((prev) =>
        [...prev, newRestaurant].sort(
          (a, b) => new Date(b.visitDate) - new Date(a.visitDate)
        )
      );
      navigate("/");
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardsContainer>
      <div className="page-wrapper">
        <h1 className="heading">Create Entry</h1>
        {isLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Image Upload */}
            <div className="file-upload-container">
              <label htmlFor="image" className="image-upload-btn">
                <BsUpload className="upload-btn" />
              </label>
              <input
                className="image-upload"
                type="file"
                name="image"
                id="image"
                onChange={(e) => handleFileChange(e)}
              />
              {entry.image ? (
                <span className="file-name">{entry.image}</span>
              ) : (
                <span className="file-name">Choose File</span>
              )}
            </div>

            <div className="form-inputs">
              {/* Place search (auto-fills name, cuisine, price, location) */}
              <div className="place-search">
                <label>Search for a restaurant</label>
                <div ref={searchRef} className="place-search-input" />
                <span className="place-search-hint">
                  Pick a result to auto-fill the fields below. You can still
                  edit anything or fill it in by hand.
                </span>
              </div>

              {/* Restaurant name */}
              <FormRow
                type={"text"}
                name={"title"}
                value={entry.name}
                handleChange={(e) =>
                  setEntry({ ...entry, name: e.target.value })
                }
                placeholder="Title"
              />

              <div>
                <label htmlFor="review">Review</label>
                <textarea
                  rows={8}
                  name="review"
                  id="review"
                  value={entry.review}
                  onChange={(e) =>
                    setEntry({ ...entry, review: e.target.value })
                  }
                  placeholder="Add a Description"
                ></textarea>
              </div>

              {/* Cuisine */}
              <FormRow
                type={"text"}
                name={"cuisine"}
                value={entry.cuisine}
                handleChange={(e) =>
                  setEntry({ ...entry, cuisine: e.target.value })
                }
                placeholder="Cuisine"
              />

              {/* visitDate */}
              {/* https://reactdatepicker.com/ */}
              <label htmlFor="date">Date Visit</label>
              <DatePicker
                selected={entry.visitDate}
                onChange={(date) => handleDate(date)}
                closeOnScroll={true}
                maxDate={new Date()}
                placeholderText="Click to select a date"
                dateFormat="MM / dd / yyyy"
              />

              {/* Rating */}
              <label htmlFor="rating">Rating</label>
              <RateRangeEl
                Icon={TiStarFullOutline}
                num={5}
                onClick={(e) => setEntry({ ...entry, rating: e })}
                range={entry.rating}
              />

              {/* PriceRange */}
              <label htmlFor="price">Price</label>
              <RateRangeEl
                Icon={BiDollar}
                num={4}
                onClick={(e) => handlePriceRange(e)}
                range={entry.priceRange.length}
              />

              <div className="btn-container">
                <button className="btn save-btn orange-btn" type="submit">
                  Save Entry
                </button>
                <button
                  to="/"
                  className="btn cancel-btn"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </CardsContainer>
  );
};
export default CreateRestaurant;

const CardsContainer = styled.div`
  padding-right: var(--container-padding);
  padding-bottom: var(--container-padding);
  width: 100%;

  form {
    display: flex;
    align-items: flex-start;
    gap: 55px;
  }

  .image-upload,
  .form-inputs {
    width: 50%;
  }

  .react-datepicker-wrapper {
    display: block;
  }

  .place-search {
    margin-bottom: 16px;
  }

  .place-search .place-autocomplete {
    width: 100%;
    margin-top: 4px;
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
  .place-search .place-autocomplete::part(input),
  .place-search .place-autocomplete::part(input-container) {
    background: transparent;
    border: none;
    outline: none;
    box-shadow: none;
  }

  .place-search .place-autocomplete::part(focus-ring) {
    display: none;
  }

  .place-search-hint {
    display: block;
    margin-top: 6px;
    font-size: 0.8rem;
    color: var(--text-secondary-color, #888);
  }

  #image {
    display: none;
  }

  .file-upload-container {
    width: 50%;
    aspect-ratio: 1 / 1;
    background-color: var(--bg-secondary-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--card-radius);
  }

  .image-upload-btn {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--upload-icon-color);
    color: var(--bg-color);
    border-radius: 50%;
    cursor: pointer;
    font-size: 26px;
    margin-bottom: 20px;
  }

  .file-name {
    width: 380px;
    text-align: center;
    word-break: break-word;
  }

  .btn-container {
    margin-top: 32px;
  }

  .save-btn {
    margin-right: 20px;
  }

  @media (max-width: 1024px) {
    padding-left: var(--container-padding);
    padding-top: var(--container-padding);

    form {
      flex-direction: column;
      gap: 32px;
    }

    .image-upload,
    .form-inputs,
    .file-upload-container {
      width: 100%;
    }
  }
`;
