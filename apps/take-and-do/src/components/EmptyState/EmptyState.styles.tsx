"use client";

import styled from "styled-components";

export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

export const EmptyStateImageWrapper = styled.div`
  width: 96px;
  height: 96px;
  margin-bottom: 16px;
  position: relative;
`;

export const EmptyStateTitle = styled.p`
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

export const EmptyStateText = styled.p`
  color: #888;
  font-size: 14px;
  margin: 0;
`;

