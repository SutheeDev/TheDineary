import styled from "styled-components";

const FormRow = ({
  type,
  name,
  value,
  handleChange,
  labelText,
  placeholder,
  list,
}) => {
  return (
    <Wrapper>
      <label htmlFor={name}>{labelText || name}</label>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        list={list}
      />
    </Wrapper>
  );
};
export default FormRow;

const Wrapper = styled.div`
  margin-bottom: 16px;

  label {
    text-transform: capitalize;
  }

  input {
    width: 100%;
    outline: none;
    border: none;
    padding: 10.25px 10px;
    border-radius: var(--form-radius);
    background-color: var(--bg-secondary-color);
  }
`;
