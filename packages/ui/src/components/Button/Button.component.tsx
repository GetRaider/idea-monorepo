"use client";
import { ReactNode, ButtonHTMLAttributes } from "react";
import { Button as ButtonRadix } from "@radix-ui/themes";

type ButtonVariant = "solid" | "soft" | "outline" | "ghost";
type ButtonSize = "1" | "2" | "3" | "4";
type ButtonColor =
  | "gray"
  | "gold"
  | "bronze"
  | "brown"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "grass"
  | "green"
  | "mint"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "plum"
  | "pink"
  | "crimson"
  | "red"
  | "tomato"
  | "ruby";

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  className?: string;
  onClick?: () => unknown;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const Button = ({
  children,
  className,
  onClick,
  variant = "solid",
  size = "3",
  color,
  disabled,
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <ButtonRadix
      className={className}
      size={size}
      variant={variant}
      color={color}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </ButtonRadix>
  );
};
