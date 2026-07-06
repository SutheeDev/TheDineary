import { useState } from "react";
import { useParams } from "react-router-dom";
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
import { FiCoffee } from "react-icons/fi";

const Restaurant = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigate = useNavigate();

  const { id } = useParams();

  const { restaurants, isAlert, isLoading } = useGlobalContext();
  const restaurant = restaurants.find((res) => res._id === id);

  const date = new Date(restaurant.visitDate);
  const formattedDate = formatDate(date);

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

  return (
    <main>
      {isAlert && <Alert />}
      <Navbar />
      <Content>
        {isLoading ? (
          <Loading />
        ) : (
          <div className="page-wrapper">
            <div className="icons">
              <IoIosCloseCircleOutline
                className="close-btn"
                onClick={() => navigate("/")}
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
                    <p>{formattedDate}</p>
                  </div>
                  <div className="cuisine">
                    <FiCoffee />
                    <p>{restaurant.cuisine}</p>
                  </div>
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

  .icons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--container-padding);
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
  .cuisine {
    display: flex;
    align-items: center;
  }

  .date,
  .cuisine {
    gap: 12px;
  }

  .date p,
  .cuisine p {
    font-size: 20px;
  }

  .date svg,
  .cuisine svg {
    font-size: 24px;
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
    color: var(--text-secondary-color);
  }

  .rating_price {
    display: flex;
    align-items: center;
  }

  .date,
  .cuisine,
  .price {
    width: 50%;
  }

  .menu-btn-container {
    position: relative;
  }

  @media (max-width: 1024px) {
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
