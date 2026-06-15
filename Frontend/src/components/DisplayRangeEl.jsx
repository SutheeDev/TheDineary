import styled from "styled-components";

const DisplayRangeEl = ({ Icon, numOfEl, highlightEl }) => {
  const arr = Array.from({ length: numOfEl }, (_, i) => i + 1);

  return (
    <RangeEl>
      {arr.map((el) => (
        <Icon
          key={el}
          className="el"
          color={
            el <= highlightEl
              ? "var(--text-secondary-color)"
              : "var(--bg-secondary-color)"
          }
        />
      ))}
    </RangeEl>
  );
};
export default DisplayRangeEl;

const RangeEl = styled.div`
  .el {
    font-size: 20px;
  }
`;
