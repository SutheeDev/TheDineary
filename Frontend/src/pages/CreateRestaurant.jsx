import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RateRangeEl,
  FormRow,
  Loading,
  PlaceSearch,
  SelectDropdown,
} from "../components";
import apiClient from "../utils/apiClient";
import { CUISINES } from "../utils/constants";
import { useGlobalContext } from "../App";

// Import Icons
import { TiStarFullOutline } from "react-icons/ti";
import { BiDollar } from "react-icons/bi";
import { BsUpload } from "react-icons/bs";

const CATEGORIES = [
  { key: "food", label: "Food" },
  { key: "service", label: "Service" },
  { key: "ambience", label: "Ambience" },
  { key: "value", label: "Value" },
];

const CATEGORY_OPTIONS = [
  "Restaurant",
  "Coffee Shop",
  "Bakery / Pastry",
  "Bar",
  "Dessert",
  "Street Food",
  "Other",
];

const initialState = {
  name: "",
  cuisine: "",
  visitDate: "",
  ratings: { food: 0, service: 0, ambience: 0, value: 0 },
  notes: { food: "", service: "", ambience: "", value: "" },
  review: "",
  priceRange: "",
  category: "",
  location: null,
};

const CreateRestaurant = () => {
  const { state } = useLocation();

  // When opened from the map's "Add this restaurant" flow, the picked place is
  // passed in router state; seed the form with it. Direct visits start blank.
  const [entry, setEntry] = useState(() => ({
    ...initialState,
    ...(state?.prefill || {}),
  }));

  const { setRestaurants, setIsLoading, isLoading, showToast } =
    useGlobalContext();

  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  // Auto-fill from a picked place, keeping any value the user already typed
  // when the place is missing that field.
  const handlePlaceSelect = (place) => {
    setEntry((prev) => ({
      ...prev,
      name: place.name || prev.name,
      cuisine: place.cuisine || prev.cuisine,
      priceRange: place.priceRange || prev.priceRange,
      location: place.location,
    }));
  };

  // Convert date into ISO format
  const handleDate = (date) => {
    const isoDate = date.toISOString();
    setEntry({ ...entry, visitDate: isoDate });
    setFieldErrors((prev) => ({ ...prev, visitDate: "" }));
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

  const handleRating = (key, value) => {
    setEntry((prev) => ({
      ...prev,
      ratings: { ...prev.ratings, [key]: value },
    }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleNote = (key, value) => {
    setEntry((prev) => ({
      ...prev,
      notes: { ...prev.notes, [key]: value },
    }));
  };

  const validate = () => {
    const errors = {};
    if (!entry.name) errors.name = "(Required)";
    if (!entry.visitDate) errors.visitDate = "(Required)";
    CATEGORIES.forEach(({ key }) => {
      if (!(entry.ratings[key] > 0)) errors[key] = "(Required)";
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      showToast("Please complete the required fields", "error");
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
      showToast("Restaurant saved", "success");
      // Return to the map when the add started there so the new pin shows up;
      // otherwise go to the Home list as before.
      navigate(state?.prefill ? "/map" : "/");
    } catch (err) {
      showToast(
        err.response?.data?.msg || "Something went wrong. Please try again.",
        "error"
      );
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
          <form onSubmit={handleSubmit} noValidate>
            {/* Image Upload */}
            <div className="file-upload-container">
              <label htmlFor="image" className="image-upload-btn">
                <BsUpload className="upload-btn" />
              </label>
              <input
                className="image-upload"
                type="file"
                accept="image/*"
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
                <PlaceSearch
                  className="place-search-input"
                  onSelect={handlePlaceSelect}
                />
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
                handleChange={(e) => {
                  setEntry({ ...entry, name: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="Title"
                required
                error={fieldErrors.name}
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

              {/* Cuisine (suggest-as-you-type; any typed value is allowed) */}
              <SelectDropdown
                label="Cuisine"
                name="cuisine"
                value={entry.cuisine}
                onChange={(next) => setEntry({ ...entry, cuisine: next })}
                options={CUISINES}
                placeholder="Select a cuisine"
                editable
              />

              {/* Category (pick from the fixed list; optional) */}
              <SelectDropdown
                label="Category"
                name="category"
                value={entry.category}
                onChange={(next) => setEntry({ ...entry, category: next })}
                options={CATEGORY_OPTIONS}
                placeholder="Select a category"
              />

              {/* visitDate */}
              {/* https://reactdatepicker.com/ */}
              <div className="date-field">
                <div className="field-label-row">
                  <label htmlFor="date">
                    Date Visit
                    <span className="required-star"> *</span>
                  </label>
                  {fieldErrors.visitDate && (
                    <span className="field-error">{fieldErrors.visitDate}</span>
                  )}
                </div>
                <DatePicker
                  selected={entry.visitDate}
                  onChange={(date) => handleDate(date)}
                  closeOnScroll={true}
                  maxDate={new Date()}
                  placeholderText="Select a date"
                  dateFormat="MM / dd / yyyy"
                />
              </div>

              {/* Category ratings (half-stars) + optional per-category note */}
              {CATEGORIES.map(({ key, label }) => (
                <div className="rating-category" key={key}>
                  <div className="field-label-row">
                    <label>
                      {label}
                      <span className="required-star"> *</span>
                    </label>
                    {fieldErrors[key] && (
                      <span className="field-error">{fieldErrors[key]}</span>
                    )}
                  </div>
                  <RateRangeEl
                    half
                    Icon={TiStarFullOutline}
                    num={5}
                    onClick={(value) => handleRating(key, value)}
                    range={entry.ratings[key]}
                  />
                  <textarea
                    rows={2}
                    value={entry.notes[key]}
                    onChange={(e) => handleNote(key, e.target.value)}
                    placeholder={`Add a note about the ${label.toLowerCase()} (optional)`}
                  ></textarea>
                </div>
              ))}

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
                  type="button"
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

  .date-field {
    margin-bottom: 16px;
  }

  .rating-category {
    margin-bottom: 16px;
  }

  .rating-category textarea {
    margin-top: 6px;
  }

  .field-label-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .field-label-row .field-error {
    margin: 0;
  }

  .field-error {
    color: var(--orange);
    font-size: 13px;
    margin-top: 6px;
    margin-bottom: 4px;
  }

  .required-star {
    color: var(--orange);
  }

  .place-search {
    margin-bottom: 16px;
  }

  .place-search-input {
    margin-top: 4px;
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
