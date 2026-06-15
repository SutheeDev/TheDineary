import { Card, Loading } from "../components/index";
import { useGlobalContext } from "../App";

import styled from "styled-components";

const Home = () => {
  const { user, restaurants, isLoading } = useGlobalContext();

  return (
    <CardsContainer>
      <div className="page-wrapper">
        <h1 className="heading">
          {user.name ? `Welcome ${user.name}` : "Welcome"}
        </h1>
        {isLoading ? (
          <Loading />
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
