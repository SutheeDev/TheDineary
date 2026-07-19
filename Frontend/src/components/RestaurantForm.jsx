import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import RateRangeEl from "./RateRangeEl";
import FormRow from "./FormRow";
import Loading from "./Loading";
import PlaceSearch from "./PlaceSearch";
import SelectDropdown from "./SelectDropdown";
import apiClient from "../utils/apiClient";
import { CUISINES, CATEGORIES, CATEGORY_OPTIONS } from "../utils/constants";
import { useGlobalContext } from "../App";

// Import Icons
import { TiStarFullOutline } from "react-icons/ti";
import { BiDollar } from "react-icons/bi";
import { BsUpload } from "react-icons/bs";

// Shared create/edit form. The parent supplies the initial value and an
// `onSubmit(payload)` that does the API call, updates the global list, shows its
// own success toast, and navigates. This form owns the fields, validation,
// payload building, the submit spinner, and the generic error toast. Create
// passes `showPlaceSearch`; Update omits it (editing does not re-pick a place).
const RestaurantForm = ({
  heading,
  submitLabel,
  initialValue,
  onSubmit,
  showPlaceSearch = false,
}) => {
  const { showToast } = useGlobalContext();
  const navigate = useNavigate();

  const [entry, setEntry] = useState(initialValue);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill from a picked place, keeping any value the user already typed
  // when the place is missing that field.
  const handlePlaceSelect = (place) => {
    setEntry((prev) => ({
      ...prev,
      name: place.name || prev.name,
      cuisine: place.cuisine || prev.cuisine,
      priceRange: place.priceRange || prev.priceRange,
      location: place.location,
      google: place.google ?? prev.google,
    }));
  };

  // Convert date into ISO format
  const handleDate = (date) => {
    const isoDate = date.toISOString();
    setEntry((prev) => ({ ...prev, visitDate: isoDate }));
    setFieldErrors((prev) => ({ ...prev, visitDate: "" }));
  };

  const handlePriceRange = (priceRange) => {
    // Convert the number into a string of "$" (e.g. 3 -> "$$$").
    setEntry((prev) => ({ ...prev, priceRange: "$".repeat(priceRange) }));
  };

  const uploadImages = async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    // Upload through our backend, which signs the request with server-side
    // Cloudinary credentials, then returns the hosted images ({ url, publicId }).
    try {
      const response = await apiClient.post("/restaurants/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.images;
    } catch (error) {
      showToast(
        error.response?.data?.msg || "Image upload failed. Please try again.",
        "error"
      );
      return [];
    }
  };

  // Upload the picked files and append them to the list. New images always go to
  // the end; the first image in the list is the cover.
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const uploaded = await uploadImages(files);
    if (uploaded.length) {
      setEntry((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          ...uploaded.map((img) => ({ ...img, caption: "" })),
        ],
      }));
    }
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
  };

  const handleCaption = (index, value) => {
    setEntry((prev) => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? { ...img, caption: value } : img
      ),
    }));
  };

  const removeImage = (index) => {
    setEntry((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Swap an image with its neighbour to reorder the list.
  const moveImage = (index, dir) => {
    setEntry((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.images.length) return prev;
      const next = [...prev.images];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, images: next };
    });
  };

  // Make an image the cover by moving it to the front of the list.
  const setCover = (index) => {
    setEntry((prev) => {
      if (index === 0) return prev;
      const next = [...prev.images];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return { ...prev, images: next };
    });
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

  const addDish = () => {
    setEntry((prev) => ({
      ...prev,
      dishes: [...prev.dishes, { name: "", note: "" }],
    }));
  };

  const handleDish = (index, field, value) => {
    setEntry((prev) => ({
      ...prev,
      dishes: prev.dishes.map((dish, i) =>
        i === index ? { ...dish, [field]: value } : dish
      ),
    }));
  };

  const removeDish = (index) => {
    setEntry((prev) => ({
      ...prev,
      dishes: prev.dishes.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const errors = {};
    if (!entry.name) errors.name = "(Required)";
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

    setIsSubmitting(true);

    // Drop blank dish rows so empty entries never reach the database.
    const payload = {
      ...entry,
      dishes: entry.dishes.filter((dish) => dish.name.trim()),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      showToast(
        err.response?.data?.msg || "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardsContainer>
      <div className="page-wrapper">
        <h1 className="heading">{heading}</h1>
        {isSubmitting ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Image Upload (multiple; first image is the cover) */}
            <div className="image-upload-section">
              <label htmlFor="image" className="add-images-btn">
                <BsUpload />
                <span>Add photos</span>
              </label>
              <input
                className="image-upload"
                type="file"
                accept="image/*"
                name="images"
                id="image"
                multiple
                onChange={(e) => handleFileChange(e)}
              />

              {entry.images.length > 0 && (
                <div className="image-list">
                  {entry.images.map((img, index) => (
                    <div
                      className="image-item"
                      key={img.publicId || img.url || index}
                    >
                      <div className="thumb">
                        <img src={img.url} alt="" />
                        {index === 0 && (
                          <span className="cover-tag">Cover</span>
                        )}
                      </div>
                      <div className="image-item-controls">
                        <input
                          type="text"
                          className="caption-input"
                          value={img.caption}
                          onChange={(e) => handleCaption(index, e.target.value)}
                          placeholder="Caption (optional)"
                        />
                        <div className="image-item-actions">
                          <button
                            type="button"
                            onClick={() => moveImage(index, -1)}
                            disabled={index === 0}
                            aria-label="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, 1)}
                            disabled={index === entry.images.length - 1}
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => setCover(index)}
                            >
                              Set as cover
                            </button>
                          )}
                          <button
                            type="button"
                            className="remove-img-btn"
                            onClick={() => removeImage(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-inputs">
              {/* Place search (auto-fills name, cuisine, price, location) */}
              {showPlaceSearch && (
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
              )}

              {/* Restaurant name */}
              <FormRow
                type={"text"}
                name={"title"}
                value={entry.name}
                handleChange={(e) => {
                  setEntry((prev) => ({ ...prev, name: e.target.value }));
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
                    setEntry((prev) => ({ ...prev, review: e.target.value }))
                  }
                  placeholder="Add a Description"
                ></textarea>
              </div>

              {/* Cuisine (suggest-as-you-type; any typed value is allowed) */}
              <SelectDropdown
                label="Cuisine"
                name="cuisine"
                value={entry.cuisine}
                onChange={(next) =>
                  setEntry((prev) => ({ ...prev, cuisine: next }))
                }
                options={CUISINES}
                placeholder="Select a cuisine"
                editable
              />

              {/* Category (pick from the fixed list; optional) */}
              <SelectDropdown
                label="Category"
                name="category"
                value={entry.category}
                onChange={(next) =>
                  setEntry((prev) => ({ ...prev, category: next }))
                }
                options={CATEGORY_OPTIONS}
                placeholder="Select a category"
              />

              {/* visitDate */}
              {/* https://reactdatepicker.com/ */}
              <div className="date-field">
                <div className="field-label-row">
                  <label htmlFor="date">
                    Date Visit
                    <span className="optional-hint"> (optional)</span>
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

              {/* Dishes (optional list of what was eaten) */}
              <div className="dishes">
                <label>Dishes</label>
                {entry.dishes.map((dish, index) => (
                  <div className="dish-row" key={index}>
                    <input
                      type="text"
                      value={dish.name}
                      onChange={(e) => handleDish(index, "name", e.target.value)}
                      placeholder="Dish name"
                    />
                    <input
                      type="text"
                      value={dish.note}
                      onChange={(e) => handleDish(index, "note", e.target.value)}
                      placeholder="Note (optional)"
                    />
                    <button
                      type="button"
                      className="remove-dish-btn"
                      onClick={() => removeDish(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-dish-btn"
                  onClick={addDish}
                >
                  Add dish
                </button>
              </div>

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
                  {submitLabel}
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
export default RestaurantForm;

const CardsContainer = styled.div`
  padding-right: var(--container-padding);
  padding-bottom: var(--container-padding);
  width: 100%;

  form {
    display: flex;
    align-items: flex-start;
    gap: 55px;
  }

  .image-upload-section,
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

  .optional-hint {
    color: var(--text-third-color);
    font-size: 13px;
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

  .add-images-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    aspect-ratio: 16 / 9;
    background-color: var(--bg-secondary-color);
    border-radius: var(--card-radius);
    cursor: pointer;
    color: var(--text-third-color);
    font-size: 15px;
  }

  .add-images-btn svg {
    font-size: 28px;
    color: var(--upload-icon-color);
  }

  .image-list {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .image-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .image-item .thumb {
    position: relative;
    width: 96px;
    height: 96px;
    flex-shrink: 0;
    border-radius: var(--form-radius);
    overflow: hidden;
  }

  .image-item .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .cover-tag {
    position: absolute;
    bottom: 4px;
    left: 4px;
    padding: 1px 6px;
    border-radius: var(--btn-radius);
    background: var(--orange);
    color: #fff;
    font-size: 11px;
  }

  .image-item-controls {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .caption-input {
    width: 100%;
    margin-bottom: 0;
    border: none;
    outline: none;
    padding: 8px 10px;
    border-radius: var(--form-radius);
    background-color: var(--bg-secondary-color);
  }

  .image-item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .image-item-actions button {
    background-color: transparent;
    border: 1px solid var(--bg-secondary-color);
    color: var(--text-third-color);
    padding: 4px 10px;
    border-radius: var(--btn-radius);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }

  .image-item-actions button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .image-item-actions .remove-img-btn:hover {
    color: var(--orange);
    border-color: var(--orange);
  }

  .btn-container {
    margin-top: 32px;
  }

  .save-btn {
    margin-right: 20px;
  }

  .dishes {
    margin-bottom: 16px;
  }

  .dish-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 8px;
  }

  .dish-row input {
    flex: 1;
    margin-bottom: 0;
    outline: none;
    border: none;
    padding: 10.25px 10px;
    border-radius: var(--form-radius);
    background-color: var(--bg-secondary-color);
  }

  .remove-dish-btn {
    background-color: transparent;
    border: 1px solid var(--bg-secondary-color);
    color: var(--text-third-color);
    padding: 6px 12px;
    border-radius: var(--btn-radius);
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }

  .add-dish-btn {
    margin-top: 8px;
    background-color: transparent;
    border: 1px dashed var(--text-third-color);
    color: var(--text-third-color);
    padding: 6px 12px;
    border-radius: var(--btn-radius);
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }

  .add-dish-btn:hover {
    color: var(--orange);
    border-color: var(--orange);
  }

  @media (max-width: 1024px) {
    padding-left: var(--container-padding);
    padding-top: var(--container-padding);

    form {
      flex-direction: column;
      gap: 32px;
    }

    .image-upload-section,
    .form-inputs {
      width: 100%;
    }
  }
`;
