import styled from "styled-components";
import { useGlobalContext } from "../App";
import { useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useParams, useNavigate } from "react-router-dom";

const Alert = () => {
  const {
    setIsAlert,
    user,
    restaurants,
    setRestaurants,
    setIsLoading,
    isLoading,
  } = useGlobalContext();
  const userId = user._id;
  const { id } = useParams();

  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsAlert(false);
    setIsLoading(true);
    try {
      const response = await apiClient.delete(`/restaurants/${userId}/${id}`);
      const deletedRes = response.data;
      setRestaurants(restaurants.filter((res) => res._id !== deletedRes._id));
      navigate("/");
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [restaurants]);

  return (
    <Wrapper>
      <div className="msg-container">
        <h3>Are you sure?</h3>
        <p>
          Do you really want to delete this restaurant? This process cannot be
          undone.
        </p>
        <div className="btn-container">
          <button className="btn cancel-btn" onClick={() => setIsAlert(false)}>
            Cancel
          </button>
          <button className="btn delete-btn" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </Wrapper>
  );
};
export default Alert;

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: var(--overlay);
  position: fixed;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  z-index: 50;
  overflow: hidden;

  .msg-container {
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background-color: var(--bg-color);
    border-radius: var(--card-radius);
    padding: var(--container-padding);
    text-align: center;
  }

  .btn-container {
    margin-top: 20px;
  }

  .delete-btn {
    background-color: red;
    color: var(--white);
  }

  .btn {
    width: 120px;
    margin: 0 7px;
  }
`;
