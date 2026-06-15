import { useState } from "react";
import styled from "styled-components";

const RateRangeEl = ({ Icon, num, onClick, range }) => {
  const [hover, setHover] = useState(0);

  const arr = Array.from({ length: num }, (_, i) => i + 1);

  return (
    <RangeEl>
      {arr.map((el) => (
        <Icon
          key={el}
          className="el"
          color={
            el <= (hover || range)
              ? "var(--text-secondary-color)"
              : "var(--bg-secondary-color)"
          }
          onMouseEnter={() => setHover(el)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onClick(el)}
        />
      ))}
    </RangeEl>
  );
};
export default RateRangeEl;

const RangeEl = styled.div`
  .el {
    font-size: 20px;
    cursor: pointer;
  }
`;
