import styled from "styled-components";
import { FaStar } from "react-icons/fa";
import { FiTag, FiMapPin } from "react-icons/fi";
import { getCuisineIcon } from "../utils/constants";

// Shared summary block used by the calendar hover card and the map popup: a
// cover thumbnail, name + score, an optional middle slot (children), and the
// meta chips. Each caller supplies its own container (positioning, background)
// and any extra rows via children.
const RestaurantSummary = ({ restaurant, includeArea = false, children }) => {
  const cover = restaurant.images?.[0]?.url || restaurant.image;
  const CuisineIcon = getCuisineIcon(restaurant.cuisine);

  // First two non-empty parts of the location, e.g. "Austin, Texas". Only built
  // when the caller opts in (the map already shows a full address instead).
  const area = includeArea
    ? [
        restaurant.location?.city,
        restaurant.location?.state,
        restaurant.location?.country,
      ]
        .filter(Boolean)
        .slice(0, 2)
        .join(", ")
    : "";

  const hasMeta =
    restaurant.cuisine || restaurant.priceRange || restaurant.category || area;

  return (
    <Wrapper>
      <div className="summary-head">
        {cover && <img className="summary-thumb" src={cover} alt="" />}
        <div className="summary-title">
          <span className="summary-name">{restaurant.name}</span>
          {restaurant.finalScore != null && (
            <span className="summary-score">
              <FaStar />
              {restaurant.finalScore}
            </span>
          )}
        </div>
      </div>
      {children}
      {hasMeta && (
        <div className="summary-meta">
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
      )}
    </Wrapper>
  );
};
export default RestaurantSummary;

const Wrapper = styled.div`
  .summary-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .summary-thumb {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    object-fit: cover;
    border-radius: var(--form-radius);
  }

  .summary-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  .summary-name {
    font-family: var(--primary-font-medium);
    font-size: 15px;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .summary-score {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    font-size: 14px;

    svg {
      color: var(--text-secondary-color);
    }
  }

  .summary-meta {
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

    svg {
      font-size: 13px;
      flex-shrink: 0;
    }
  }
`;
