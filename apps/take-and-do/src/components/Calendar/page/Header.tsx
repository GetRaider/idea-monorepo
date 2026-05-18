import Image from "next/image";

import { AppPageTitle, WelcomeSection } from "@/app/shell.ui";
import { PrimaryButton } from "@/components/Buttons";
import { PlusIcon } from "@/components/Icons";
import {
  APP_CHROME_NAV_ICON_PX,
  APP_CHROME_TITLE_ACTION_ROW,
} from "@/helpers/app-chrome-layout";
import { cn } from "@/lib/styles/utils";

type PageHeaderProps = {
  onCreateEvent: () => void;
};

export function PageHeader({ onCreateEvent }: PageHeaderProps) {
  return (
    <WelcomeSection
      className={cn(
        "flex shrink-0 flex-col gap-4",
        APP_CHROME_TITLE_ACTION_ROW,
      )}
    >
      <div className="min-w-0 flex-1">
        <AppPageTitle
          icon={
            <Image
              width={APP_CHROME_NAV_ICON_PX}
              height={APP_CHROME_NAV_ICON_PX}
              src="/calendar.svg"
              alt=""
              className="shrink-0 opacity-95"
            />
          }
        >
          Calendar
        </AppPageTitle>
      </div>
      <PrimaryButton
        size="sm"
        className="shrink-0 font-medium"
        onClick={onCreateEvent}
      >
        <PlusIcon size={18} className="shrink-0" />
        Create Event
      </PrimaryButton>
    </WelcomeSection>
  );
}
