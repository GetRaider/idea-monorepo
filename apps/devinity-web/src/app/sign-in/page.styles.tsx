import styled from "styled-components";

export const SignInContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 2rem;
`;

export const SignInCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  max-width: 450px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const BrandName = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const SignInTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
  text-align: center;
`;

export const SignInDescription = styled.p`
  font-size: 1.1rem;
  color: #cbd5e1;
  margin: 0;
  text-align: center;
  line-height: 1.6;
  max-width: 350px;
`;

export const GitHubButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: #24292e;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 250px;
  justify-content: center;

  &:hover {
    background: #1a1e22;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    flex-shrink: 0;
  }
`;
