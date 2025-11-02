import styled from "styled-components";
import Link from "next/link";

export const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #3c2856 100%);
  overflow: hidden;
`;

export const MainContent = styled.main<{ $withNavSidebar: boolean }>`
  flex: 1;
  margin-left: ${(props) => (props.$withNavSidebar ? "340px" : "60px")};
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  overflow-y: auto;
  padding: 32px;
  color: #fff;
  background: linear-gradient(135deg, #1a1a1a 0%, #3c2856 100%);
`;

export const WelcomeSection = styled.div`
  margin-bottom: 32px;
`;

export const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const Subtitle = styled.p`
  font-size: 18px;
  color: #cbd5e1;
  margin: 0;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

export const StatCard = styled.div`
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
  }
`;

export const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  border-radius: 8px;
  color: #667eea;
`;

export const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
`;

export const StatLabel = styled.div`
  font-size: 14px;
  color: #888;
  font-weight: 500;
`;

export const Section = styled.div`
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`;

export const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #fff;
`;

export const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const TaskItem = styled.div`
  padding: 12px;
  background: #2a2a2a;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #333;
  }
`;

export const TaskSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

export const TaskStatusBadge = styled.span<{ $status: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${(props) => {
    switch (props.$status) {
      case "To Do":
        return "#3b82f6";
      case "In Progress":
        return "#f59e0b";
      case "Done":
        return "#10b981";
      default:
        return "#6b7280";
    }
  }};
  color: #fff;
`;

export const CalendarSection = styled.div`
  color: #888;
  padding: 16px 0;
`;

export const AISection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
`;

export const AICard = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #333;
`;

export const QuickActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
`;

export const ActionButton = styled(Link)`
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

  &:hover:not([style*="opacity"]) {
    background: #5a42a1;
    transform: translateY(-2px);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #2a2a2a;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
