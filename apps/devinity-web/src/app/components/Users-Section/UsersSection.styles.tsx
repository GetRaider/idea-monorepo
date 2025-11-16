import styled from "styled-components";

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

export const UserCard = styled.div`
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin: 0.5rem 0;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(148, 163, 184, 0.15);
    border-color: rgba(148, 163, 184, 0.3);
    transform: translateY(-2px);
  }

  p {
    margin: 0;
    color: #f1f5f9;
    font-weight: 500;
  }

  @media (max-width: 640px) {
    padding: 0.75rem 1rem;
  }
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(139, 92, 246, 0.2);
  border-top-color: rgba(139, 92, 246, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
