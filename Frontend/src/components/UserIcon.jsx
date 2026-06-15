import { useState } from "react";
import { ProfileDropdown } from "../components/index";
import { IoChevronDown } from "react-icons/io5";
import { HiOutlineUserCircle } from "react-icons/hi2";
import styled from "styled-components";

const UserIcon = () => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  return (
    <Wrapper onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
      <div className="down-arrow-container">
        <IoChevronDown />
      </div>
      <div className="userIcon-container">
        <HiOutlineUserCircle />
      </div>
      {isProfileDropdownOpen && (
        <ProfileDropdown
          setIsProfileDropdownOpen={setIsProfileDropdownOpen}
          isProfileDropdownOpen={isProfileDropdownOpen}
        />
      )}
    </Wrapper>
  );
};
export default UserIcon;

const Wrapper = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  cursor: pointer;

  position: relative;

  .userIcon-container {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    font-size: 40px;
  }

  .userIcon-container svg {
    width: var(--user-icon-size);
  }

  .down-arrow-container {
    width: 16px;
    height: 16px;
  }

  svg {
    color: var(--text-color);
  }
`;
