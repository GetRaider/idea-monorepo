import styled from "styled-components";
import { Button, IconButton } from "@radix-ui/themes";
import Image from "next/image";

export const SidebarContainer = styled.aside<{ $collapsed: boolean }>`
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  width: ${(props) => (props.$collapsed ? "80px" : "260px")};
  padding: 0.75rem 0.5rem;
  border-right: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.5);
  transition: width 0.2s ease;

  @media (max-width: 1024px) {
    position: fixed;
    top: 64px;
    left: 0;
    height: calc(100vh - 64px);
    z-index: 50;
  }
`;

export const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
`;

export const ToggleButton = styled(IconButton)`
  min-width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #cbd5e1;
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
  padding: 0 10px;
  border-radius: 10px;
  letter-spacing: 0.2px;
  justify-content: ${(props) => (props.$collapsed ? "center" : "flex-start")};
`;

export const Label = styled.span<{ $collapsed: boolean }>`
  white-space: nowrap;
  display: ${(props) => (props.$collapsed ? "none" : "inline")};
`;

export const Icon = styled(Image)`
  opacity: 0.9;
`;
