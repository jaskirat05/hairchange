"use client"

import { UserHistory } from "@/components/user-history";
import { usePathname } from "next/navigation";

export function HistoryProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showHistory = !pathname!.includes("/sign-in") && !pathname!.includes("/sign-up");

  return (
    <>
      {children}
      {showHistory && <UserHistory />}
    </>
  );
}
