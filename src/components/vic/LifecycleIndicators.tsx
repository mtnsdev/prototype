"use client";

import { AlertCircle, Cake, Clock } from "lucide-react";
import type { VIC } from "@/types/vic";

function daysFromToday(iso: string | undefined): number | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.floor((d.getTime() - t.getTime()) / (24 * 60 * 60 * 1000));
  } catch {
    return null;
  }
}

function isBirthdayWithin14Days(dob: string | undefined): boolean {
  if (!dob) return false;
  try {
    const birth = new Date(dob);
    const today = new Date();
    const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    const diff = (thisYear.getTime() - today.getTime()) / (24 * 60 * 60 * 1000);
    return diff >= 0 && diff <= 14;
  } catch {
    return false;
  }
}

function isInactiveOver6Months(vic: VIC): boolean {
  const updated = vic.updated_at ?? (vic as { updated_at?: string }).updated_at;
  if (!updated) return false;
  try {
    const d = new Date(updated);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return d < sixMonthsAgo;
  } catch {
    return false;
  }
}

type Props = { vic: VIC; className?: string };

export default function LifecycleIndicators({ vic, className = "" }: Props) {
  const passportDays = daysFromToday(vic.passport_expiry);
  const passportWarn = passportDays != null && passportDays < 180 && passportDays >= 0;
  const birthdaySoon = isBirthdayWithin14Days(vic.date_of_birth);
  const inactive = isInactiveOver6Months(vic);

  if (!passportWarn && !birthdaySoon && !inactive) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={
      [passportWarn && "Passport expires soon", birthdaySoon && "Birthday soon", inactive && "Inactive 6+ months"].filter(Boolean).join(" · ")
    }>
      {passportWarn && <AlertCircle size={12} className="text-[var(--color-warning)] shrink-0" aria-label="Passport expiry warning" />}
      {birthdaySoon && <Cake size={12} className="text-muted-foreground shrink-0" aria-label="Birthday soon" />}
      {inactive && <Clock size={12} className="text-muted-foreground/55 shrink-0" aria-label="Inactive" />}
    </span>
  );
}
