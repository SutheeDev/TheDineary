import styled from "styled-components";
import { RateRangeEl, FormRow, Loading } from "../components";
import DatePicker from "react-datepicker";
import { useParams, useNavigate } from "react-router-dom";
import { useGlobalContext } from "../App";
import { useState } from "react";
import apiClient from "../utils/apiClient";
import { CUISINES } from "../utils/constants";
import axios from "axios";

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

const UpdateRestaurant = () => {
  const { restaurants, setRestaurants, setIsLoading, isLoading, showToast } =
    useGlobalContext();
  const { id } = useParams();
  const navigate = useNavigate();

  const restaurant = restaurants.find((res) => res._id === id);
  const cuisine = restaurant.cuisine;
  const review = restaurant.review;
  const priceRange = restaurant.priceRange;
  const imageUrl = restaurant.image;

  const initialState = {
    name: restaurant.name,
    cuisine: cuisine || "",
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
    review: review || "",
    priceRange: priceRange || 0,
    category: restaurant.category || "",
    image:
      imageUrl ||
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738184597/DineDiary/placeholder-image.png",
  };

  const [entry, setEntry] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState({});

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

  const handleDate = (date) => {
    const isoDate = date.toISOString();
    setEntry({ ...entry, visitDate: isoDate });
    setFieldErrors((prev) => ({ ...prev, visitDate: "" }));
  };

  const handlePriceRange = (priceRange) => {
    let priceSymbol = "";
    for (let i = 0; i < priceRange; i++) {
      priceSymbol += "$";
    }
    setEntry({ ...entry, priceRange: priceSymbol });
  };

  const presetName = import.meta.env.VITE_UPLOAD_PRESET_NAME;
  const cloudName = import.meta.env.VITE_CLOUD_NAME;

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", presetName);
    formData.append("folder", "DineDiary");

    try {
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

  const validate = () => {
    const errors = {};
    if (!entry.name) errors.name = "(Required)";
    if (!entry.visitDate) errors.visitDate = "(Required)";
    CATEGORIES.forEach(({ key }) => {
      if (!(entry.ratings[key] > 0)) errors[key] = "(Required)";
    });
    return errors;
  };

  const updateRestaurant = async (e) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      showToast("Please complete the required fields", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.patch(`/restaurants/${id}`, entry);
      const updatedRestaurant = response.data;
      setRestaurants(
        restaurants
          .map((res) => (res._id === id ? updatedRestaurant : res))
          .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
      );

      showToast("Changes saved", "success");
      navigate("/");
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
        <h1 className="heading">Update Entry</h1>
        {isLoading ? (
          <Loading />
        ) : (
          <form onSubmit={updateRestaurant} noValidate>
            {/* Image Upload */}
            <FileUploadContainer
              className="file-upload-container"
              bgimg={entry.image}
            >
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
                <span className="file-name">Change image</span>
              ) : (
                <span className="file-name">Add image</span>
              )}
            </FileUploadContainer>

            <div className="form-inputs">
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
              <FormRow
                type={"text"}
                name={"cuisine"}
                value={entry.cuisine}
                handleChange={(e) =>
                  setEntry({ ...entry, cuisine: e.target.value })
                }
                placeholder="Add a Cuisine"
                list="cuisine-options"
              />
              <datalist id="cuisine-options">
                {CUISINES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              {/* Category */}
              <div className="category-field">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={entry.category}
                  onChange={(e) =>
                    setEntry({ ...entry, category: e.target.value })
                  }
                >
                  <option value="">Select a category (optional)</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholderText="Click to select a date"
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
                  Save Update
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
export default UpdateRestaurant;

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

  .category-field {
    margin-bottom: 16px;
  }

  .date-field {
    margin-bottom: 16px;
  }

  .category-field select {
    display: block;
    width: 100%;
    height: 42px;
    box-sizing: border-box;
    margin-top: 4px;
    outline: none;
    border: none;
    padding: 0 32px 0 12px;
    border-radius: var(--form-radius);
    background-color: var(--bg-secondary-color);
    cursor: pointer;
    font: inherit;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
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

  #image {
    display: none;
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

const FileUploadContainer = styled.div`
  width: 50%;
  aspect-ratio: 1 / 1;
  background-color: var(--bg-secondary-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--card-radius);
  position: relative;

  background-image: ${(props) =>
    props.bgimg ? `url(${props.bgimg})` : "none"};
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
  overflow: hidden;

  /* Create overlay effect */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0);
    z-index: 1;
  }

  &:hover::after {
    background: var(--upload-overlay);
  }

  .image-upload-btn,
  .file-name {
    position: absolute;
    z-index: 5;
    opacity: 0;
  }

  &:hover .image-upload-btn,
  &:hover .file-name {
    opacity: 1;
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
    top: 58%;
    color: var(--bg-color);
    width: 380px;
    text-align: center;
    word-break: break-word;
  }
`;
