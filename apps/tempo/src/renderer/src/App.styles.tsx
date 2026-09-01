import styled, { createGlobalStyle } from "styled-components";

export const colors = {
  bg: "#07050c",
  sidebar: "#06040a",
  surface: "rgba(18, 12, 28, 0.92)",
  surfaceHover: "rgba(28, 20, 42, 0.95)",
  border: "rgba(155, 92, 255, 0.18)",
  purple: "#9b5cff",
  purpleDeep: "#7c3aed",
  tealGlow: "rgba(45, 212, 191, 0.12)",
  text: "#f4eefe",
  muted: "#8f84a8",
  danger: "#f87171",
  required: "#fb7185",
};

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    margin: 0;
    height: 100%;
  }

  body {
    font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
    background: ${colors.bg};
    color: ${colors.text};
    overflow: hidden;
  }

  @font-face {
    font-family: "IBM Plex Mono";
    font-style: normal;
    font-weight: 400 600;
    font-display: swap;
    src: local("IBM Plex Mono"), local("IBMPlexMono-Regular");
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }
`;

export const AppShell = styled.div`
  display: flex;
  height: 100%;
  min-height: 100%;
  background: ${colors.bg};
`;

export const Sidebar = styled.aside<{ $collapsed: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? "72px" : "196px")};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: ${({ $collapsed }) =>
    $collapsed ? "1.35rem 0.65rem 1rem" : "1.35rem 1rem 1rem"};
  background: ${colors.sidebar};
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  transition:
    width 0.2s ease,
    padding 0.2s ease;
`;

export const Brand = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
  gap: 0.75rem;
  padding: 0.15rem ${({ $collapsed }) => ($collapsed ? "0" : "0.35rem")} 1.35rem;
`;

export const BrandLogoButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  padding: 0.15rem;
  border-radius: 999px;
  background: transparent;
  color: ${colors.text};
  cursor: pointer;

  &:hover {
    background: ${colors.surfaceHover};
  }
`;

export const BrandLogo = styled.svg`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: ${colors.text};
`;

export const BrandCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  min-width: 0;
`;

export const BrandName = styled.span`
  font-size: 1.08rem;
  font-weight: 700;
  letter-spacing: 0.01em;
`;

export const BrandVersion = styled.span`
  color: ${colors.muted};
  font-size: 0.68rem;
`;

export const NavButton = styled.button<{
  $active: boolean;
  $collapsed: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
  gap: 0.7rem;
  border: 0;
  border-radius: 0;
  padding: ${({ $collapsed }) => ($collapsed ? "0.8rem 0" : "0.8rem 0.45rem")};
  text-align: left;
  cursor: pointer;
  color: ${({ $active }) => ($active ? colors.text : colors.muted)};
  background: transparent;
  font-size: 0.92rem;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};

  &::after {
    content: "";
    position: absolute;
    left: ${({ $collapsed }) => ($collapsed ? "20%" : "0")};
    right: ${({ $collapsed }) => ($collapsed ? "20%" : "0")};
    bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: ${({ $active }) => ($active ? colors.purple : "transparent")};
  }

  &:hover {
    color: ${colors.text};
  }
`;

export const NavLabel = styled.span<{ $collapsed: boolean }>`
  overflow: hidden;
  white-space: nowrap;
  max-width: ${({ $collapsed }) => ($collapsed ? "0" : "8rem")};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  transition:
    max-width 0.2s ease,
    opacity 0.15s ease;
`;

export const Main = styled.main`
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 1.5rem 1.75rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background:
    radial-gradient(
      ellipse 70% 42% at 50% 38%,
      ${colors.tealGlow},
      transparent 72%
    ),
    ${colors.bg};
`;

export const FocusScreen = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  gap: 1.35rem;
`;

export const SaveFieldSlot = styled.div`
  display: flex;
  align-items: center;
  min-height: 1.75rem;
`;

export const MainHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.15rem;
`;

export const ScreenTitle = styled.h1`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
`;

export const ErrorText = styled.p`
  margin: 0;
  color: ${colors.danger};
  font-size: 0.875rem;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.78rem;
  color: ${colors.muted};
`;

export const FieldLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${colors.muted};
`;

export const RequiredMark = styled.span`
  color: ${colors.required};
`;

export const CheckboxField = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${colors.muted};

  input {
    accent-color: ${colors.purple};
  }
`;

export const Select = styled.select`
  border: 1px solid ${colors.border};
  border-radius: 14px;
  background: ${colors.surface};
  color: ${colors.text};
  padding: 0.85rem 0.95rem;

  &:focus {
    outline: 2px solid ${colors.purple};
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.55;
  }
`;

const fieldControl = `
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(12, 8, 18, 0.72);
  color: ${colors.text};
  padding: 0.9rem 1rem;

  &::placeholder {
    color: rgba(143, 132, 168, 0.72);
  }

  &:focus {
    outline: 2px solid rgba(155, 92, 255, 0.45);
    outline-offset: 1px;
    border-color: rgba(155, 92, 255, 0.35);
  }

  &:disabled {
    opacity: 0.55;
  }
`;

export const TextInput = styled.input`
  ${fieldControl}

  &[type="datetime-local"] {
    color-scheme: dark;
  }

  &[type="datetime-local"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0.85);
    opacity: 0.85;
  }
`;

export const TextArea = styled.textarea`
  ${fieldControl}
  min-height: 4.5rem;
  resize: vertical;
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 0.65rem;

  > button {
    flex: 1;
  }
`;

export const Button = styled.button<{
  $variant?: "primary" | "ghost" | "danger" | "glow";
}>`
  border: ${({ $variant }) =>
    $variant === "glow" ? "1px solid rgba(168, 85, 247, 0.55)" : "0"};
  border-radius: 999px;
  padding: 0.95rem 1.15rem;
  cursor: pointer;
  font-weight: 650;
  letter-spacing: 0.04em;
  color: ${({ $variant }) => {
    if ($variant === "glow") return colors.purple;
    if ($variant === "ghost") return colors.text;
    return "#fff";
  }};
  background: ${({ $variant }) => {
    if ($variant === "danger") return "#be123c";
    if ($variant === "ghost") return colors.surface;
    if ($variant === "glow") return "rgba(12, 8, 18, 0.92)";
    return colors.purple;
  }};
  box-shadow: ${({ $variant }) => {
    if ($variant === "glow") {
      return "0 0 16px rgba(168, 85, 247, 0.35), inset 0 0 12px rgba(168, 85, 247, 0.12)";
    }
    if ($variant === undefined || $variant === "primary") {
      return "0 10px 28px rgba(124, 58, 237, 0.28)";
    }
    return "none";
  }};

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const StartButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
`;

export const StartPlayIcon = styled.span`
  font-size: 0.85rem;
  line-height: 1;
`;

export const SetupGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.25rem 2rem;
  align-items: start;
`;

export const SetupFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  padding-top: 0.35rem;
`;

export const SettingsCopy = styled.p`
  margin: 0;
  color: ${colors.muted};
  max-width: 36rem;
  line-height: 1.5;
`;
