import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { FiTag, FiMapPin } from "react-icons/fi";
import formatDate from "../utils/formatDate";
import { getCuisineIcon, PLACEHOLDER_IMAGE } from "../utils/constants";
import { FiImage } from "react-icons/fi";

const Card = ({ restaurant, view = "grid" }) => {
  const navigate = useNavigate();

  // Visit date is optional: show it when set, otherwise fall back to the entry
  // date (createdAt) and label it "Added" instead of "Visited".
  const hasVisitDate = Boolean(restaurant.visitDate);
  const shownDate = formatDate(
    new Date(hasVisitDate ? restaurant.visitDate : restaurant.createdAt)
  );
  const dateLabel = hasVisitDate ? "Visited" : "Added";

  const CuisineIcon = getCuisineIcon(restaurant.cuisine);

  // Cover = first image; fall back to the legacy single `image` field, then the
  // shared placeholder. Show a count badge when there is more than one photo.
  const cover =
    restaurant.images?.[0]?.url || restaurant.image || PLACEHOLDER_IMAGE;
  const photoCount = restaurant.images?.length || 0;

  // Compact area label: the first two non-empty parts of the location, e.g.
  // "Austin, Texas" or "Tokyo, Japan".
  const area = [
    restaurant.location?.city,
    restaurant.location?.state,
    restaurant.location?.country,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  const handleClick = () => {
    navigate(`/restaurant/${restaurant._id}`);
  };

  const meta = (
    <div className="card-meta">
      {restaurant.cuisine && (
        <span className="meta-item">
          <CuisineIcon />
          {restaurant.cuisine}
        </span>
      )}
      {restaurant.priceRange && (
        <span className="meta-item">{restaurant.priceRange}</span>
      )}
      {restaurant.category && (
        <span className="meta-item">
          <FiTag />
          {restaurant.category}
        </span>
      )}
      {area && (
        <span className="meta-item">
          <FiMapPin />
          {area}
        </span>
      )}
    </div>
  );

  return (
    <Wrapper onClick={handleClick} $view={view}>
      <div className="image">
        <img src={cover} alt={restaurant.name} />
        {photoCount > 1 && (
          <span className="photo-count">
            <FiImage />
            {photoCount}
          </span>
        )}
      </div>
      <div className="card-content">
        <div className="card-title">
          <h4>{restaurant.name}</h4>
          {restaurant.finalScore != null && (
            <span className="score">
              <FaStar className="score-icon" />
              {restaurant.finalScore}
            </span>
          )}
        </div>
        <p>
          {dateLabel} : <span>{shownDate}</span>
        </p>
        {meta}
      </div>
    </Wrapper>
  );
};
export default Card;

const Wrapper = styled.div`
  max-width: var(--card-width);
  border-radius: var(--card-radius);

  @media (max-width: 1024px) {
    max-width: 100%;
  }
  overflow: hidden;
  background-color: var(--bg-third-color);
  cursor: pointer;

  box-shadow: var(--card-shadow);

  transition: all 0.1s ease;
  &:hover {
    transform: scale(1.01);
    box-shadow: var(--card-hover);
  }

  .image {
    width: 100%;
    position: relative;
  }

  .photo-count {
    position: absolute;
    top: 10px;
    right: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--btn-radius);
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-family: var(--primary-font-light);
    font-size: 12px;
  }

  .photo-count svg {
    font-size: 12px;
  }

  img {
    min-width: 100%;
    min-height: 220px;
    max-height: 220px;
    object-fit: cover;
  }

  .card-content {
    padding: 10px 15px;
    font-family: var(--primary-font-medium);
  }
  .card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }
  .card-title h4 {
    margin-bottom: 0;
  }
  .score {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .score-icon {
    color: var(--text-secondary-color);
  }
  .card-content span {
    font-family: var(--primary-font-light);
  }

  .card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--primary-font-light);
    font-size: 13px;
    color: var(--gray-600);
    background-color: var(--bg-secondary-color);
    padding: 3px 9px;
    border-radius: var(--btn-radius);
  }

  .meta-item svg {
    font-size: 13px;
    flex-shrink: 0;
  }

  ${({ $view }) =>
    $view === "list" &&
    `
    max-width: 100%;
    display: flex;
    align-items: stretch;
    height: 130px;

    .image {
      width: 140px;
      height: 130px;
      flex-shrink: 0;
    }

    img {
      min-width: 140px;
      max-width: 140px;
      min-height: 130px;
      max-height: 130px;
      height: 130px;
    }

    .card-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 12px 18px;
    }

    @media (max-width: 639px) {
      .image {
        width: 100px;
      }

      img {
        min-width: 100px;
        max-width: 100px;
      }
    }
  `}
`;
