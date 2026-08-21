import {
  ClockCaption,
  ClockUnitSeparator,
  ClockUnits,
  ClockValue,
  ClockWrap,
} from "./ClockDisplay.styles";

export function ClockDisplay({
  value,
  caption,
  showUnits = false,
  overGoal = false,
}: ClockDisplayProps) {
  return (
    <ClockWrap>
      <ClockValue $overGoal={overGoal}>{value}</ClockValue>
      {showUnits ? (
        <ClockUnits>
          <span>H</span>
          <ClockUnitSeparator>:</ClockUnitSeparator>
          <span>M</span>
          <ClockUnitSeparator>:</ClockUnitSeparator>
          <span>S</span>
        </ClockUnits>
      ) : null}
      {caption !== null && caption.length > 0 ? (
        <ClockCaption>{caption}</ClockCaption>
      ) : null}
    </ClockWrap>
  );
}

interface ClockDisplayProps {
  value: string;
  caption: string | null;
  showUnits?: boolean;
  overGoal?: boolean;
}
