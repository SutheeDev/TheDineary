import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useGlobalContext } from "../App";

const ProfileDropdown = ({
  isProfileDropdownOpen,
  setIsProfileDropdownOpen,
}) => {
  const navigate = useNavigate();
  const { logout } = useGlobalContext();

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <Wrapper>
      <div className="dropdown">
        <div
          className="update-profile-menu"
          onClick={() => {
            navigate("/user/update");
            setIsProfileDropdownOpen(!isProfileDropdownOpen);
          }}
        >
          <p>Update Profile</p>
        </div>
        <div className="logout-menu" onClick={handleLogout}>
          <p>Log Out</p>
        </div>
      </div>
    </Wrapper>
  );
};
export default ProfileDropdown;

const Wrapper = styled.div`
  position: absolute;
  top: 45px;
  right: -14px;
  background-color: var(--text-secondary-color);
  background-color: var(--white);
  color: var(--bg-color);
  color: var(--black);
  width: 140px;
  border-radius: var(--form-radius);
  border-radius: 4px;
  padding: 8px;
  box-shadow: var(--dropdown-shadow);
  z-index: 1000;

  .dropdown {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .update-profile-menu,
  .logout-menu {
    text-align: right;
    width: 100%;
    border-radius: 4px;
    padding: 7px;
    cursor: pointer;

    transition: all 0.1s ease;
  }

  .update-profile-menu:hover,
  .logout-menu:hover {
    background-color: var(--gray-200);
  }
`;
