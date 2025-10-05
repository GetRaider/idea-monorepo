import styled from "styled-components";
import { Button, IconButton } from "@radix-ui/themes";
import Image from "next/image";

export const SidebarContainer = styled.aside<{ $collapsed: boolean }>`
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  width: ${(props) => (props.$collapsed ? "80px" : "260px")};
  padding: 1rem;
  border-right: 1px solid rgba(148, 163, 184, 0.16);
  background: #1e293b;
  transition: width 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 1024px) {
    position: fixed;
    top: 64px;
    left: 0;
    height: calc(100vh - 64px);
    z-index: 50;
  }
`;

export const NavGrid = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
`;

export const SquareButton = styled(Button)<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  letter-spacing: 0.2px;
  justify-content: ${(props) => (props.$collapsed ? "center" : "flex-start")};
  background: ${(props) =>
    props.variant === "solid" ? "#8b5cf6" : "transparent"};
  color: ${(props) => (props.variant === "solid" ? "white" : "#cbd5e1")};
  border: none;

  &:hover {
    background: ${(props) =>
      props.variant === "solid" ? "#7c3aed" : "#374151"};
  }
`;

export const Label = styled.span<{ $collapsed: boolean }>`
  white-space: nowrap;
  display: ${(props) => (props.$collapsed ? "none" : "inline")};
  color: inherit;
  font-weight: 500;
`;

export const Icon = styled(Image)`
  opacity: 0.9;
  color: #f8fafc;
`;
