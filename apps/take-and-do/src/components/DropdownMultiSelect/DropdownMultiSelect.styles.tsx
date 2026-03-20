"use client";

import styled from "styled-components";

import { DropdownWrapper, DropdownTrigger } from "../Dropdown/Dropdown.styles";

export const MultiSelectWrapper = styled(DropdownWrapper)`
  display: block;
  width: 100%;
`;

export const MultiSelectTrigger = styled(DropdownTrigger)`
  width: 100%;
  justify-content: space-between;
`;

export const TriggerLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`;

export const PortalPanel = styled.div`
  position: fixed;
  z-index: 1100;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
`;

export const EmptyHintText = styled.p`
  margin: 0;
  padding: 8px 4px;
  font-size: 14px;
  color: #666;
`;
