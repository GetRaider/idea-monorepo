"use client";

import styled from "styled-components";

export const DropdownWrapper = styled.div<{ $fullWidth?: boolean }>`
  position: relative;
  display: ${({ $fullWidth }) => ($fullWidth ? "block" : "inline-block")};
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
`;


export const DropdownTrigger = styled.button<{ $fullWidth?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  justify-content: ${({ $fullWidth }) =>
    $fullWidth ? "space-between" : "flex-start"};

  &:hover {
    border-color: #555;
  }
`;

export const TriggerWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
`;

export const ChevronIcon = styled.span<{ $open: boolean }>`
  font-size: 10px;
  color: #888;
  transition: transform 0.2s;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
`;

export const DropdownMenu = styled.ul<{ $portal?: boolean }>`
  position: ${(p) => (p.$portal ? "fixed" : "absolute")};
  display: flex;
  flex-direction: column;
  gap: 2px;
  top: ${(p) => (p.$portal ? "0" : "calc(100% + 4px)")};
  right: ${(p) => (p.$portal ? "auto" : "0")};
  left: ${(p) => (p.$portal ? "0" : "auto")};
  z-index: ${(p) => (p.$portal ? 1100 : 100)};
  min-width: ${(p) => (p.$portal ? "0" : "100%")};
  width: ${(p) => (p.$portal ? "max-content" : "auto")};
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px;
  margin: 0;
  list-style: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
`;

export const DropdownItem = styled.li<{
  $active: boolean;
  $danger?: boolean;
}>`
  padding: 8px 12px;
  font-size: 14px;
  color: ${({ $active, $danger }) => {
    if ($danger) return "#ef4444";
    return $active ? "#fff" : "#aaa";
  }};
  background: ${({ $active }) => ($active ? "#3a3a3a" : "transparent")};
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover {
    background: #3a3a3a;
    color: ${({ $danger }) => ($danger ? "#f87171" : "#fff")};
  }
`;
