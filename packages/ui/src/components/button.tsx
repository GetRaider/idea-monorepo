'use client';
import { ReactNode } from 'react';
import { Button as ButtonRadix } from '@radix-ui/themes';

interface ButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => unknown;
}

export const Button = ({ children, className, onClick }: ButtonProps) => {
  return <ButtonRadix size="3">{children}</ButtonRadix>;
};
