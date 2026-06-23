import { Card, Loading } from "../components/index";
import { useGlobalContext } from "../App";
import { Link } from "react-router-dom";
import { LuUtensilsCrossed } from "react-icons/lu";

import styled from "styled-components";

const Home = () => {
  const { user, restaurants, isLoading } = useGlobalContext();

  return (
    <CardsContainer>
      <div className="page-wrapper">
        <h1 className="heading">
          {user.name ? `Welcome ${user.name}` : "Welcome"}
        </h1>
        <p className="subtitle">Your restaurant diary</p>
        {isLoading ? (
          <Loading />
        ) : restaurants.length === 0 ? (
          <div className="empty-state">
            <LuUtensilsCrossed className="empty-icon" />
            <h2>No restaurants yet</h2>
            <p>Start your food diary by adding your first visit.</p>
            <Link to="/create" className="btn orange-btn">
              Add your first restaurant
            </Link>
          </div>
        ) : (
          <section className="cards">
            {restaurants.map((res) => (
              <Card key={res._id} restaurant={res} />
            ))}
          </section>
        )}
      </div>
    </CardsContainer>
  );
};
export default Home;

const CardsContainer = styled.div`
  padding-right: var(--container-padding);
  padding-bottom: var(--container-padding);
  width: 100%;

  .heading {
    margin-bottom: 4px;
  }

  .subtitle {
    color: var(--text-third-color);
    margin-bottom: 50px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    padding: 80px 20px;

    .empty-icon {
      font-size: 64px;
      color: var(--orange);
      margin-bottom: 8px;
    }

    h2 {
      font-family: var(--primary-font-medium);
      font-weight: 600;
    }

    p {
      color: var(--text-third-color);
    }

    .btn {
      margin-top: 8px;
    }
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--cards-gap);
  }

  @media (max-width: 1024px) {
    padding-left: var(--container-padding);
    padding-top: var(--container-padding);

    .cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 639px) {
    .cards {
      grid-template-columns: 1fr;
    }
  }
`;
