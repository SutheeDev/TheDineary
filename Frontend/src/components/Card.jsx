import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import formatDate from "../utils/formatDate";

const Card = ({ restaurant }) => {
  const navigate = useNavigate();

  const date = new Date(restaurant.visitDate);
  // Format date
  const formattedDate = formatDate(date);

  const handleClick = (e) => {
    navigate(`/restaurant/${restaurant._id}`);
  };

  return (
    <Wrapper onClick={handleClick}>
      <div className="image">
        <img src={restaurant.image} alt={restaurant.name} />
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
          Visit Date : <span>{formattedDate}</span>
        </p>
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
`;
