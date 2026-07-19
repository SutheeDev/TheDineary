import styled from "styled-components";

const FormRow = ({
  type,
  name,
  value,
  handleChange,
  labelText,
  placeholder,
  list,
  required,
  error,
}) => {
  return (
    <Wrapper>
      <div className="field-label-row">
        <label htmlFor={name}>
          {labelText || name}
          {required && <span className="required-star"> *</span>}
        </label>
        {error && <span className="field-error">{error}</span>}
      </div>
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

  .field-label-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .field-error {
    color: var(--orange);
    font-size: 13px;
  }

  .required-star {
    color: var(--orange);
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
