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

export const Divider = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 1rem;
  color: #94a3b8;
  font-size: 0.9rem;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

export const ToggleText = styled.p`
  color: #cbd5e1;
  font-size: 0.95rem;
  text-align: center;
  margin: 0;
`;

export const ErrorMessage = styled.div`
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.2);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.95rem;
  text-align: center;
`;

export const PasswordStrength = styled.div<{
  $strength: "weak" | "medium" | "strong";
}>`
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;

  ${(props) => {
    switch (props.$strength) {
      case "strong":
        return `
          color: #4ade80;
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.2);
        `;
      case "medium":
        return `
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
        `;
      case "weak":
      default:
        return `
          color: #f87171;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
        `;
    }
  }}
`;

export const ValidationMessage = styled.div<{ $type: "error" | "info" }>`
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;

  ${(props) =>
    props.$type === "error"
      ? `
          color: #f87171;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
        `
      : `
          color: #94a3b8;
          background: rgba(148, 163, 184, 0.1);
          border: 1px solid rgba(148, 163, 184, 0.2);
        `}
`;
