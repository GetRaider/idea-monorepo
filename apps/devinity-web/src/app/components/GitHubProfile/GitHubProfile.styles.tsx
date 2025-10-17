"use client";

import styled from "styled-components";

export const ProfileCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  margin-bottom: 24px;
`;

export const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
`;

export const Avatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

export const ProfileInfo = styled.div`
  flex: 1;
`;

export const Name = styled.h2`
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
`;

export const Username = styled.a`
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 16px;
  &:hover {
    text-decoration: underline;
  }
`;

export const Bio = styled.p`
  margin: 12px 0 0 0;
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.95;
`;

export const Stats = styled.div`
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

export const StatItem = styled.div`
  text-align: center;
`;

export const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
`;

export const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const ErrorMessage = styled.div`
  background: #ff4444;
  color: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
`;

export const LoadingMessage = styled.div`
  background: #f0f0f0;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  color: #666;
  margin-bottom: 24px;
`;


