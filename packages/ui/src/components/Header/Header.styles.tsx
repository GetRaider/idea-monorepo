import styled from "styled-components";
import {
  Avatar,
  Button,
  DropdownMenu,
  Link,
  IconButton,
} from "@radix-ui/themes";

export const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  padding: 0;
  width: 100%;
`;

export const Container = styled.div`
  width: 100%;
  margin: 0;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;

  @media (max-width: 768px) {
    padding: 0 0.5rem 0 0;
    height: 56px;
  }
`;

export const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: -15px; /* Move logo left to align with sidebar button left edges */
`;

export const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
  position: relative;

  &:hover {
    opacity: 0.8;
  }
`;

export const ToggleButton = styled(IconButton)<{ $show: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  min-width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: rgba(71, 85, 105, 0.9);
  border: none;
  color: #cbd5e1;
  border-radius: 8px;
  opacity: ${(props) => (props.$show ? 1 : 0)};
  visibility: ${(props) => (props.$show ? "visible" : "hidden")};
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
  z-index: 10;

  &:hover {
    background: rgba(100, 116, 139, 0.9);
  }
`;

export const Logo = styled.img`
  border-radius: 8px;
  object-fit: contain;
`;

export const BrandName = styled.span<{ $hidden: boolean }>`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f8fafc;
  letter-spacing: -0.025em;
  display: ${(props) => (props.$hidden ? "none" : "inline")};

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const AvatarButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 9999px;
`;
