import {
  ColorGrid,
  ColorOption,
  ColorPickerLabel,
  ColorPickerRoot,
  ColorPreview,
} from "./ColorPicker.styles";

import { SESSION_COLORS } from "../../../shared/session-colors";

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <ColorPickerRoot>
      <ColorPickerLabel>
        Colour
        <ColorPreview $color={value} aria-hidden />
      </ColorPickerLabel>
      <ColorGrid>
        {SESSION_COLORS.map((color) => (
          <ColorOption
            key={color}
            type="button"
            $color={color}
            $active={value === color}
            aria-label={`Select colour ${color}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
          />
        ))}
      </ColorGrid>
    </ColorPickerRoot>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}
