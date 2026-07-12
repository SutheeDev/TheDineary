import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useGlobalContext } from "../App";
import styled from "styled-components";
import formatDate from "../utils/formatDate";
import { useNavigate } from "react-router-dom";
import {
  Navbar,
  DisplayRangeEl,
  DropdownMenu,
  Alert,
  Loading,
} from "../components";

// Import Icons
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import { BiDollar } from "react-icons/bi";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FiEdit2 } from "react-icons/fi";
import { GoKebabHorizontal } from "react-icons/go";
import { FiCalendar } from "react-icons/fi";
import { FiTag } from "react-icons/fi";
import { getCuisineIcon } from "../utils/constants";

// Read-only Google feature chips, grouped for display. Each key matches a
// canonical attribute stored on restaurant.google.attributes (see PlaceSearch);
// only keys present-and-true are shown, and empty groups are skipped.
const ATTRIBUTE_GROUPS = [
  {
    title: "Service",
    keys: {
      dineIn: "Dine-in",
      takeout: "Takeout",
      delivery: "Delivery",
      curbsidePickup: "Curbside pickup",
      reservable: "Reservations",
      outdoorSeating: "Outdoor seating",
    },
  },
  {
    title: "Food & Drink",
    keys: {
      servesBreakfast: "Breakfast",
      servesLunch: "Lunch",
      servesDinner: "Dinner",
      servesBrunch: "Brunch",
      servesVegetarianFood: "Vegetarian",
      servesCoffee: "Coffee",
      servesDessert: "Dessert",
      servesBeer: "Beer",
      servesWine: "Wine",
      servesCocktails: "Cocktails",
    },
  },
  {
    title: "Amenities",
    keys: {
      goodForChildren: "Good for kids",
      menuForChildren: "Kids' menu",
      goodForGroups: "Good for groups",
      restroom: "Restroom",
      goodForWatchingSports: "Sports viewing",
      liveMusic: "Live music",
      allowsDogs: "Dog-friendly",
    },
  },
  {
    title: "Accessibility",
    keys: {
      hasWheelchairAccessibleEntrance: "Accessible entrance",
      hasWheelchairAccessibleParking: "Accessible parking",
      hasWheelchairAccessibleRestroom: "Accessible restroom",
      hasWheelchairAccessibleSeating: "Accessible seating",
    },
  },
  {
    title: "Parking",
    keys: {
      hasFreeParkingLot: "Free parking lot",
      hasPaidParkingLot: "Paid parking lot",
      hasFreeStreetParking: "Free street parking",
      hasPaidStreetParking: "Paid street parking",
      hasFreeGarageParking: "Free garage",
      hasPaidGarageParking: "Paid garage",
      hasValetParking: "Valet",
    },
  },
  {
    title: "Payments",
    keys: {
      acceptsCreditCards: "Credit cards",
      acceptsDebitCards: "Debit cards",
      acceptsNFC: "NFC / contactless",
      acceptsCashOnly: "Cash only",
    },
  },
];

// Format a Google Money amount (a plain number) as a whole-unit currency string.
const formatMoney = (amount, currency) => {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount}`;
  }
};

const Restaurant = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const { id } = useParams();

  const { restaurants, isAlert, isLoading } = useGlobalContext();
  const restaurant = restaurants.find((res) => res._id === id);

  // Visit date is optional: show the visit date when set, otherwise fall back to
  // the entry date (createdAt) and label it "Added" instead of "Visited".
  const hasVisitDate = Boolean(restaurant.visitDate);
  const shownDate = formatDate(
    new Date(hasVisitDate ? restaurant.visitDate : restaurant.createdAt)
  );
  const dateLabel = hasVisitDate ? "Visited" : "Added";
  const CuisineIcon = getCuisineIcon(restaurant.cuisine);

  const ratings = restaurant.ratings || {};
  const notes = restaurant.notes || {};
  const finalScore = restaurant.finalScore;
  const categories = [
    { key: "food", label: "Food" },
    { key: "service", label: "Service" },
    { key: "ambience", label: "Ambience" },
    { key: "value", label: "Value" },
  ];
  let price;
  restaurant.priceRange ? (price = restaurant.priceRange.length) : (price = 0);

  // Read-only Google data (optional; absent on manual entries).
  const google = restaurant.google;

  let perPersonPrice = null;
  if (google?.priceRange) {
    const { startPrice, endPrice, currency } = google.priceRange;
    const start = formatMoney(startPrice, currency);
    const end = formatMoney(endPrice, currency);
    if (start && end) perPersonPrice = `${start} - ${end} per person`;
    else if (start) perPersonPrice = `From ${start} per person`;
  }

  const attributes = google?.attributes || {};
  const featureGroups = ATTRIBUTE_GROUPS.map((group) => ({
    title: group.title,
    items: Object.entries(group.keys)
      .filter(([key]) => attributes[key])
      .map(([, label]) => label),
  })).filter((group) => group.items.length > 0);

  // Gentle nudge: list the optional fields this entry is still missing so they
  // can be filled in later. Photo is left out because every entry gets a
  // placeholder image by default, so "missing" cannot be told apart reliably.
  const missingFields = [];
  if (!restaurant.cuisine) missingFields.push("cuisine");
  if (!restaurant.category) missingFields.push("category");
  if (!restaurant.priceRange) missingFields.push("price");

  return (
    <main>
      {isAlert && <Alert />}
      <Navbar />
      <Content>
        {isLoading ? (
          <Loading />
        ) : (
          <div className="page-wrapper">
            <div className="detail-card">
              <div className="icons">
                <IoIosCloseCircleOutline
                  className="close-btn"
                  onClick={() =>
                    location.key !== "default" ? navigate(-1) : navigate("/")
                  }
                />
                <div
                  className="menu-btn-container"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <GoKebabHorizontal className="menu-btn" />
                  {isDropdownOpen && <DropdownMenu />}
                </div>
              </div>
              <div className="restaurant-content">
              <div className="restaurant-img">
                <img src={restaurant.image} alt={restaurant.name} />
              </div>
              <div className="restaurant-details">
                <h2>{restaurant.name}</h2>
                <div className="date_cuisine">
                  <div className="date">
                    <FiCalendar />
                    <p>
                      {dateLabel}: {shownDate}
                    </p>
                  </div>
                  {restaurant.cuisine && (
                    <div className="cuisine">
                      <CuisineIcon />
                      <p>{restaurant.cuisine}</p>
                    </div>
                  )}
                  {restaurant.category && (
                    <div className="category">
                      <FiTag />
                      <p>{restaurant.category}</p>
                    </div>
                  )}
                </div>
                <p className="review">{restaurant.review}</p>

                {finalScore != null && (
                  <div className="final-score">
                    <span className="score-number">{finalScore}</span>
                    <DisplayRangeEl
                      Icon={FaStar}
                      HalfIcon={FaStarHalfAlt}
                      numOfEl="5"
                      highlightEl={finalScore}
                    />
                  </div>
                )}

                <div className="categories">
                  {categories.map(({ key, label }) => (
                    <div className="category" key={key}>
                      <div className="category-header">
                        <p>{label}</p>
                        <DisplayRangeEl
                          Icon={FaStar}
                          HalfIcon={FaStarHalfAlt}
                          numOfEl="5"
                          highlightEl={ratings[key] || 0}
                        />
                      </div>
                      {notes[key] && <p className="note">{notes[key]}</p>}
                    </div>
                  ))}
                </div>

                {restaurant.dishes?.length > 0 && (
                  <div className="dishes">
                    <p className="dishes-title">Dishes</p>
                    {restaurant.dishes.map((dish, index) => (
                      <div className="dish" key={index}>
                        <p className="dish-name">{dish.name}</p>
                        {dish.note && <p className="note">{dish.note}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="rating_price">
                  <div className="price">
                    <p>Price</p>
                    <DisplayRangeEl
                      Icon={BiDollar}
                      numOfEl="4"
                      highlightEl={price}
                    />
                  </div>
                </div>

                {google && (
                  <div className="google-info">
                    {google.hours?.length > 0 && (
                      <div className="google-section">
                        <p className="google-title">Opening hours</p>
                        <ul className="hours-list">
                          {google.hours.map((line, index) => (
                            <li key={index}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {google.website && (
                      <div className="google-section">
                        <p className="google-title">Website</p>
                        <a
                          className="website-link"
                          href={google.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {google.website}
                        </a>
                      </div>
                    )}

                    {perPersonPrice && (
                      <div className="google-section">
                        <p className="google-title">Price per person</p>
                        <p>{perPersonPrice}</p>
                      </div>
                    )}

                    {featureGroups.length > 0 && (
                      <div className="google-section">
                        <p className="google-title">Features</p>
                        {featureGroups.map((group) => (
                          <div className="feature-group" key={group.title}>
                            <p className="feature-group-title">{group.title}</p>
                            <div className="feature-chips">
                              {group.items.map((label) => (
                                <span className="feature-chip" key={label}>
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {missingFields.length > 0 && (
                  <div className="complete-entry">
                    <p className="complete-entry-title">Complete this entry</p>
                    <div className="complete-entry-chips">
                      {missingFields.map((field) => (
                        <button
                          key={field}
                          type="button"
                          className="complete-chip"
                          onClick={() =>
                            navigate(`/restaurant/update/${id}`)
                          }
                        >
                          Add {field}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
        )}
      </Content>
    </main>
  );
};
export default Restaurant;

const Content = styled.div`
  min-height: calc(100vh - 137px);
  background-color: var(--bg-third-color);
  padding: var(--container-padding);

  .detail-card {
    background-color: var(--bg-color);
    border-radius: var(--card-radius);
    box-shadow: var(--card-shadow);
    padding: 40px;
  }

  .icons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .restaurant-content {
    display: flex;
    align-items: flex-start;
    gap: 55px;
  }

  .restaurant-img {
    width: 50%;
    border-radius: var(--card-radius);
    overflow: hidden;
  }

  .restaurant-img img {
    width: 100%;
    max-height: 370px;
    display: block;
    object-fit: cover;
  }

  .restaurant-details {
    width: 50%;
  }

  .close-btn {
    cursor: pointer;
    width: var(--nav-icon-size);
    height: var(--nav-icon-size);

    transition: all 0.1s ease;
  }

  .menu-btn {
    cursor: pointer;
    width: var(--menu-icon-size);
    height: var(--menu-icon-size);

    transition: all 0.1s ease;
  }

  .close-btn:hover,
  .menu-btn:hover {
    transform: scale(1.05);
  }

  .restaurant-details h2 {
    font-size: var(--header-size);
  }

  .date_cuisine,
  .date,
  .cuisine,
  .category {
    display: flex;
    align-items: center;
  }

  .date_cuisine {
    gap: 12px;
    flex-wrap: wrap;
  }

  .date,
  .cuisine,
  .category {
    gap: 8px;
    background-color: var(--bg-secondary-color);
    padding: 6px 12px;
    border-radius: var(--btn-radius);
  }

  .date p,
  .cuisine p,
  .category p {
    font-size: 15px;
  }

  .date svg,
  .cuisine svg,
  .category svg {
    font-size: 16px;
  }

  .review {
    max-width: 500px;
  }

  .restaurant-details h2,
  .date_cuisine,
  .review {
    margin-bottom: 30px;
  }

  .final-score {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .final-score .score-number {
    font-size: 32px;
    font-family: var(--primary-font-medium);
  }

  .categories {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 30px;
    padding-top: 24px;
    border-top: 1px solid var(--bg-secondary-color);
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .category-header p {
    width: 90px;
  }

  .note {
    margin-top: 4px;
    font-family: var(--primary-font-light);
    color: var(--gray-600);
  }

  .dishes {
    margin-bottom: 30px;
    padding-top: 24px;
    border-top: 1px solid var(--bg-secondary-color);
  }

  .dishes-title {
    margin-bottom: 12px;
  }

  .dishes .dish {
    margin-bottom: 12px;
  }

  .rating_price {
    display: flex;
    align-items: center;
  }

  .google-info {
    margin-bottom: 30px;
  }

  .google-section {
    padding-top: 24px;
    margin-bottom: 20px;
    border-top: 1px solid var(--bg-secondary-color);
  }

  .google-title {
    margin-bottom: 12px;
  }

  .hours-list {
    list-style: none;
    padding: 0;
  }

  .hours-list li {
    font-family: var(--primary-font-light);
    color: var(--gray-600);
    margin-bottom: 4px;
  }

  .website-link {
    color: var(--orange);
    word-break: break-all;
  }

  .feature-group {
    margin-bottom: 16px;
  }

  .feature-group-title {
    font-size: 14px;
    color: var(--text-third-color);
    margin-bottom: 8px;
  }

  .feature-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .feature-chip {
    background-color: var(--bg-secondary-color);
    padding: 6px 12px;
    border-radius: var(--btn-radius);
    font-size: 14px;
  }

  .menu-btn-container {
    position: relative;
  }

  .complete-entry {
    margin-top: 30px;
    padding-top: 24px;
    border-top: 1px solid var(--bg-secondary-color);
  }

  .complete-entry-title {
    font-size: 14px;
    color: var(--text-third-color);
    margin-bottom: 12px;
  }

  .complete-entry-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .complete-chip {
    border: 1px dashed var(--text-third-color);
    background-color: transparent;
    color: var(--text-third-color);
    padding: 6px 12px;
    border-radius: var(--btn-radius);
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .complete-chip:hover {
    color: var(--orange);
    border-color: var(--orange);
  }

  @media (max-width: 1024px) {
    .detail-card {
      padding: 24px;
    }

    .restaurant-content {
      flex-direction: column;
      gap: 32px;
    }

    .restaurant-img,
    .restaurant-details {
      width: 100%;
    }
  }
`;
