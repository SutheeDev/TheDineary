import { useState, useEffect } from "react";
import styled from "styled-components";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { PLACEHOLDER_IMAGE } from "../utils/constants";

// One image at a time with prev/next arrows, dots, and the current image's
// caption. Arrows/dots/counter hide when there is a single image. Falls back to
// a placeholder when there are no images. Sizing is fully CSS-driven so it stays
// responsive as the window resizes. Supports left/right arrow keys when focused.
const ImageCarousel = ({ images = [], alt = "" }) => {
  const slides = images.length
    ? images
    : [{ url: PLACEHOLDER_IMAGE, caption: "" }];
  const hasMultiple = slides.length > 1;

  const [index, setIndex] = useState(0);

  // Keep the active index in range if the image list shrinks.
  useEffect(() => {
    if (index > slides.length - 1) {
      setIndex(0);
    }
  }, [slides.length, index]);

  const goTo = (next) => setIndex((next + slides.length) % slides.length);

  const handleKeyDown = (e) => {
    if (!hasMultiple) return;
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
  };

  const current = slides[index];

  return (
    <Wrapper tabIndex={hasMultiple ? 0 : -1} onKeyDown={handleKeyDown}>
      <div className="viewport">
        <img src={current.url} alt={alt} />
        {hasMultiple && (
          <>
            <button
              type="button"
              className="arrow arrow-left"
              onClick={() => goTo(index - 1)}
              aria-label="Previous image"
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              className="arrow arrow-right"
              onClick={() => goTo(index + 1)}
              aria-label="Next image"
            >
              <FiChevronRight />
            </button>
            <span className="counter">
              {index + 1} / {slides.length}
            </span>
          </>
        )}
      </div>

      {current.caption && <p className="caption">{current.caption}</p>}

      {hasMultiple && (
        <div className="dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === index ? "dot active" : "dot"}
              onClick={() => setIndex(i)}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </Wrapper>
  );
};
export default ImageCarousel;

const Wrapper = styled.div`
  width: 100%;
  outline: none;

  .viewport {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    max-height: 370px;
    border-radius: var(--card-radius);
    overflow: hidden;
    background-color: var(--bg-secondary-color);
  }

  .viewport img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-size: 22px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .arrow:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .arrow-left {
    left: 12px;
  }

  .arrow-right {
    right: 12px;
  }

  .counter {
    position: absolute;
    bottom: 12px;
    right: 12px;
    padding: 3px 9px;
    border-radius: var(--btn-radius);
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 13px;
    font-family: var(--primary-font-light);
  }

  .caption {
    margin-top: 10px;
    font-size: 14px;
    color: var(--text-secondary-color);
    text-align: center;
    word-break: break-word;
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
  }

  .dot {
    width: 9px;
    height: 9px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--bg-secondary-color);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .dot.active {
    background: var(--orange);
  }

  .dot:hover {
    background: var(--text-third-color);
  }
`;
