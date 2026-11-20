"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function CalendarEventRedirectPage() {
  return (
    <Suspense>
      <CalendarEventRedirect />
    </Suspense>
  );
}

function CalendarEventRedirect() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    const suffix = search ? `?${search}` : "";
    router.replace(`/planning/calendar/events/${params.eventId}${suffix}`);
  }, [params.eventId, router, searchParams]);

  return null;
}
