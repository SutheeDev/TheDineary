import styled from "styled-components";
import { useGlobalContext } from "../App";
import { useNavigate, useParams } from "react-router-dom";

const DropdownMenu = () => {
  const { setIsAlert } = useGlobalContext();
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <Wrapper>
      <div className="dropdown">
        <div
          className="edit-menu"
          onClick={() => navigate(`/restaurant/update/${id}`)}
        >
          <p>Edit</p>
        </div>
        <div className="delete-menu" onClick={() => setIsAlert(true)}>
          <p>Delete</p>
        </div>
      </div>
    </Wrapper>
  );
};
export default DropdownMenu;

const Wrapper = styled.div`
  position: absolute;
  top: 30px;
  right: 0;
  background-color: var(--text-secondary-color);
  background-color: var(--white);
  color: var(--bg-color);
  color: var(--black);
  width: 90px;
  border-radius: var(--form-radius);
  border-radius: 4px;
  padding: 8px;
  box-shadow: var(--dropdown-shadow);

  .dropdown {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .edit-menu,
  .delete-menu {
    text-align: right;
    width: 100%;
    border-radius: 4px;
    padding: 7px;
    cursor: pointer;

    transition: all 0.1s ease;
  }

  .edit-menu:hover,
  .delete-menu:hover {
    background-color: var(--gray-200);
  }
`;
