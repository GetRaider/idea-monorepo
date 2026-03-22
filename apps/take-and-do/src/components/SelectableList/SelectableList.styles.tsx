"use client";

import styled from "styled-components";

export const SelectableListTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
`;

export const TaskSelectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const SelectAllRow = styled.button`
  background: none;
  border: none;
  color: #7255c1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;

  &:hover {
    color: #9678e3;
  }

  &:focus-visible {
    outline: 2px solid #7255c1;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const TaskSelectionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
`;

export const TaskCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #7255c1;

  &:focus-visible {
    outline: 2px solid #7255c1;
    outline-offset: 2px;
  }
`;

export const TaskLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  span {
    color: #e2e8f0;
    font-size: 14px;
  }

  &:hover {
    border-color: #4a4a4a;
    background: #2f2f2f;
  }

  &:focus-within {
    border-color: #7255c1;
    box-shadow: 0 0 0 3px rgba(114, 85, 193, 0.25);
  }
`;
