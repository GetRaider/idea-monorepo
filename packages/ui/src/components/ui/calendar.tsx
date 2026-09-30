"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "../../lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 [--cell-size:2rem]", className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "text-sm font-medium",
          defaultClassNames.caption_label,
        ),
        nav: cn(
          "absolute inset-x-0 top-3 flex items-center justify-between px-3",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "inline-flex size-7 items-center justify-center rounded-md text-foreground hover:bg-accent",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "inline-flex size-7 items-center justify-center rounded-md text-foreground hover:bg-accent",
          defaultClassNames.button_next,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "w-[--cell-size] text-center text-[0.8rem] font-normal text-muted-foreground",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(
          "relative p-0 text-center text-sm",
          defaultClassNames.day,
        ),
        day_button: cn(
          "inline-flex size-[--cell-size] items-center justify-center rounded-md text-foreground hover:bg-accent",
          defaultClassNames.day_button,
        ),
        selected: cn(
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
          defaultClassNames.selected,
        ),
        today: cn(
          "[&>button]:bg-accent [&>button]:text-accent-foreground",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return (
            <Icon className={cn("size-4", iconClassName)} {...iconProps} />
          );
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
