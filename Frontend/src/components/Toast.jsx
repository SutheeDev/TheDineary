import styled from "styled-components";
import { IoClose } from "react-icons/io5";
import { useGlobalContext } from "../App";

const Toast = () => {
  const { toasts, removeToast } = useGlobalContext();

  if (!toasts.length) return null;

  return (
    <Wrapper>
      {toasts.map(({ id, message, type }) => (
        <div key={id} className={`toast toast-${type}`}>
          <span className="toast-msg">{message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => removeToast(id)}
            aria-label="Dismiss message"
          >
            <IoClose />
          </button>
        </div>
      ))}
    </Wrapper>
  );
};
export default Toast;

const Wrapper = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .toast {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 260px;
    max-width: 360px;
    padding: 14px 16px;
    border-radius: var(--form-radius);
    background-color: var(--bg-color);
    box-shadow: var(--card-shadow);
    border-left: 4px solid var(--gray-400);
    animation: toast-in 0.25s ease;
  }

  .toast-success {
    border-left-color: #2e9e5b;
  }

  .toast-error {
    border-left-color: var(--orange);
  }

  .toast-info {
    border-left-color: var(--gray-400);
  }

  .toast-msg {
    flex: 1;
    font-size: 14px;
    color: var(--text-color);
  }

  .toast-close {
    display: flex;
    align-items: center;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--text-third-color);
    font-size: 18px;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 639px) {
    left: 20px;
    right: 20px;

    .toast {
      min-width: 0;
      max-width: none;
    }
  }
`;
