import { useRef, useState } from "react";
import styled from "styled-components";
import { useClickOutside } from "../utils/useClickOutside";

// Shared dropdown used by both Cuisine and Category so their open menus look the
// same (a native <select>'s open list is OS-drawn and cannot be styled). Two modes:
//   editable=true  -> Cuisine: type-to-filter (starts-with) and any typed value is kept.
//   editable=false -> Category: pick from the fixed list only (no typing).
// Controlled by the `value` prop, so a place picked from the search bar still fills it.
// The menu opens only from user interaction; opening always shows the full list, and
// typing narrows it (so a custom value like "Fusion" never leaves the menu empty).
const SelectDropdown = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  editable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef(null);

  const query = value.trim().toLowerCase();
  const shown =
    editable && isTyping
      ? options.filter((o) => o.toLowerCase().startsWith(query))
      : options;

  const items = shown.map((o) => ({ label: o, value: o }));

  // Close the menu when clicking anywhere outside this field.
  useClickOutside(wrapperRef, () => setIsOpen(false));

  const open = () => {
    setIsOpen(true);
    setIsTyping(false);
    setHighlightIndex(-1);
  };

  const select = (item) => {
    onChange(item.value);
    setIsOpen(false);
    setIsTyping(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      setHighlightIndex((i) => Math.min(i + 1, items.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && isOpen && highlightIndex >= 0) {
      e.preventDefault();
      select(items[highlightIndex]);
    }
  };

  return (
    <Wrapper ref={wrapperRef}>
      <label htmlFor={name}>{label}</label>
      <input
        type="text"
        name={name}
        id={name}
        autoComplete="off"
        readOnly={!editable}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          if (!editable) return;
          onChange(e.target.value);
          setIsOpen(true);
          setIsTyping(true);
          setHighlightIndex(-1);
        }}
        onFocus={open}
        onClick={open}
        onKeyDown={handleKeyDown}
      />
      {isOpen && items.length > 0 && (
        <ul className="dropdown-menu">
          {items.map((item, index) => (
            <li
              key={item.value}
              className={index === highlightIndex ? "active" : ""}
              // onMouseDown fires before the input blur so the pick is not lost.
              onMouseDown={(e) => {
                e.preventDefault();
                select(item);
              }}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </Wrapper>
  );
};
export default SelectDropdown;

const Wrapper = styled.div`
  position: relative;
  margin-bottom: 16px;

  label {
    text-transform: capitalize;
  }

  input {
    width: 100%;
    outline: none;
    border: none;
    padding: 10.25px 32px 10.25px 10px;
    border-radius: var(--form-radius);
    background-color: var(--bg-secondary-color);
    font: inherit;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    max-height: 240px;
    overflow-y: auto;
    list-style: none;
    padding: 4px 0;
    z-index: 20;
    background-color: var(--bg-secondary-color);
    border-radius: var(--form-radius);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .dropdown-menu li {
    padding: 8px 12px;
    cursor: pointer;
  }

  .dropdown-menu li.active {
    background-color: var(--bg-color);
  }
`;
