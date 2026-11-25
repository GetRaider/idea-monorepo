import { Link } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getRequestContext } from "@/lib/api/habits";

const NAV_ITEMS = [
  { href: "/", label: "Today", id: "today" },
  { href: "/board", label: "Board", id: "board" },
  { href: "/week", label: "Week", id: "week" },
] as const;

export function AppShell({
  current,
  children,
  width = "max-w-[920px]",
}: {
  current: "today" | "board" | "week";
  children: React.ReactNode;
  width?: string;
}) {
  const { date } = getRequestContext();

  return (
    <View className="h-screen bg-background">
      <View className="flex-row items-center justify-between px-6 py-4 sm:px-10">
        <View className="flex-row items-center gap-6">
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="link"
              className="flex-row items-center gap-2"
            >
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#1f6b45]">
                <Text className="text-sm font-bold text-white">✓</Text>
              </View>
              <Text className="text-lg font-semibold">Evolin</Text>
            </Pressable>
          </Link>
          <View className="flex-row items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const selected = item.id === current;
              return (
                <Link key={item.id} href={item.href} asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityState={{ selected }}
                    className={cn(
                      "min-h-11 items-center justify-center rounded-full px-4",
                      selected ? "bg-[#e7f2ea]" : "",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm font-medium",
                        selected ? "text-foreground" : "text-muted",
                      )}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>
        <Text className="text-sm text-muted">{formatHeaderDate(date)}</Text>
      </View>
      <ScrollView className="flex-1" contentContainerClassName="pb-16">
        <View className={cn("mx-auto w-full px-6 pt-4 sm:px-10", width)}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

export function formatHeaderDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function formatDayNumber(isoDate: string): string {
  return String(Number(isoDate.slice(8, 10)));
}

export function formatWeekday(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "short",
  });
}

export function formatEstablishedDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
