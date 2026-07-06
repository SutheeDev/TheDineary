import { useState } from "react";
import styled from "styled-components";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";

const RateRangeEl = ({ Icon, num, onClick, range, half }) => {
  const [hover, setHover] = useState(0);

  const arr = Array.from({ length: num }, (_, i) => i + 1);

  // Opt-in half-star mode: each star has a left half (x.5) and right half (x.0)
  // click/hover zone. Used by the four category ratings; the "$" price input
  // does not pass `half`, so it keeps the whole-number behavior below.
  if (half) {
    const active = hover || range;
    return (
      <HalfRangeEl>
        {arr.map((el) => {
          const filled = active >= el;
          const halfFilled = !filled && active >= el - 0.5;
          const StarIcon = halfFilled ? FaStarHalfAlt : FaStar;
          return (
            <span className="star" key={el}>
              <StarIcon
                className="star-icon"
                color={
                  filled || halfFilled
                    ? "var(--text-secondary-color)"
                    : "var(--bg-secondary-color)"
                }
              />
              <span
                className="zone left"
                onMouseEnter={() => setHover(el - 0.5)}
                onMouseLeave={() => setHover(0)}
                onClick={() => onClick(el - 0.5)}
              />
              <span
                className="zone right"
                onMouseEnter={() => setHover(el)}
                onMouseLeave={() => setHover(0)}
                onClick={() => onClick(el)}
              />
            </span>
          );
        })}
      </HalfRangeEl>
    );
  }

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

const HalfRangeEl = styled.div`
  display: flex;

  .star {
    position: relative;
    display: inline-flex;
  }

  .star-icon {
    font-size: 22px;
  }

  .zone {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    cursor: pointer;
  }

  .zone.left {
    left: 0;
  }

  .zone.right {
    right: 0;
  }
`;
