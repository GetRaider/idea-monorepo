import { keyframes, css } from "styled-components";

// Animated gradient keyframes - diagonal movement for organic feel
// Customize: Change angle (45deg), colors, or animation duration
export const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Animation speed: 15s for subtle motion (change duration to adjust speed)
// Direction: 135deg diagonal for organic feel (change angle to adjust direction)

export const animatedGradientBackground = css`
  background: linear-gradient(
    135deg,
    #1a0a2e 0%,
    #2d1b4e 25%,
    #6a00ff 50%,
    #8b5cf6 75%,
    #9333ea 100%
  );
  background-size: 200% 200%;
  animation: ${gradientShift} 15s ease infinite;
  will-change: background-position;
  transform: translateZ(0);
`;

export const animatedGradientHover = css`
  animation-duration: 10s;
`;
