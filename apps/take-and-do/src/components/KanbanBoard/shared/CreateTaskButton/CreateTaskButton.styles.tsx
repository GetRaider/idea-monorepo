"use client";

import {
  animatedGradientBackground,
  animatedGradientHover,
} from "@/app/home/ProductivityOverview/animatedGradient";
import styled from "styled-components";

export const DropdownMenu = styled.div`
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 100%;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  overflow: hidden;
`;

export const Wrapper = styled.div`
  position: relative;
  display: inline-block;

  &::after {
    content: "";
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    height: 4px;
  }

  &:hover ${DropdownMenu} {
    display: block;
  }
`;

export const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  width: 100%;
  background: #7255c1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: default;
  transition: background 0.2s;

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const DropdownItem = styled.button`
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;

  &:hover {
    background: #3a3a3a;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #3a3a3a;
  }
`;

export const AIDropdownItem = styled(DropdownItem)`
  ${animatedGradientBackground}
`;
