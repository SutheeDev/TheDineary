import styled from "styled-components";

const DisplayRangeEl = ({ Icon, HalfIcon, numOfEl, highlightEl }) => {
  const arr = Array.from({ length: numOfEl }, (_, i) => i + 1);

  return (
    <RangeEl>
      {arr.map((el) => {
        // When HalfIcon is passed, show a half-filled icon for a .5 score.
        // The "$" price display passes no HalfIcon, so it stays whole-number.
        const filled = el <= highlightEl;
        const halfFilled = HalfIcon && !filled && highlightEl >= el - 0.5;
        const ElIcon = halfFilled ? HalfIcon : Icon;
        return (
          <ElIcon
            key={el}
            className="el"
            color={
              filled || halfFilled
                ? "var(--text-secondary-color)"
                : "var(--bg-secondary-color)"
            }
          />
        );
      })}
    </RangeEl>
  );
};
export default DisplayRangeEl;

const RangeEl = styled.div`
  .el {
    font-size: 20px;
  }
`;
