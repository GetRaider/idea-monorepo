import styled from "styled-components";

export const Main = styled.main`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 2rem 6rem;
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);

  @media (max-width: 768px) {
    padding: 1rem 2rem;
    min-height: calc(100vh - 56px);
  }

  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 800px;
  width: 100%;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1.5rem;
  }
`;

export const MainTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 640px) {
    font-size: 1.75rem;
  }
`;

export const Description = styled.p`
  font-size: 1.25rem;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.6;
  max-width: 600px;

  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 640px) {
    font-size: 0.9rem;
  }
`;

export const AuthContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;
