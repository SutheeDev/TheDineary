import styled from "styled-components";

const Loading = () => {
  return (
    <Wrapper>
      <h2>Loading...</h2>
      <div className="loading-container">
        <div className="loading-wheel"></div>
      </div>
    </Wrapper>
  );
};
export default Loading;

const Wrapper = styled.div`
  h2 {
    margin-bottom: 20px;
  }

  .loading-container {
    width: 100%;
    display: grid;
    place-items: center;
  }

  .loading-wheel {
    width: 100px;
    height: 100px;
    border-radius: 50px;
    border-top: solid 5px var(--orange);
    border-bottom: solid 5px var(--orange);
    border-left: solid 5px var(--white);
    border-right: solid 5px var(--white);
    animation: loading 0.5s ease-in-out infinite;
  }

  @keyframes loading {
    0% {
      rotate: 0deg;
    }
    100% {
      rotate: 360deg;
    }
  }
`;
