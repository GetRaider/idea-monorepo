"use client";

import styled from "styled-components";
import Link from "next/link";

export const Container = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
`;

export const ActionButton = styled(Link)<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #7255c1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};

  &:hover {
    background: ${(props) => (props.$disabled ? "#7255c1" : "#5a42a1")};
    transform: ${(props) => (props.$disabled ? "none" : "translateY(-2px)")};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

