"use client";
import { useRef } from "react";

/** 検索欄・ドロップダウン変更で即時に再検索（O11 の OnChange → Refresh 相当） */
export default function AutoSubmitForm({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submit = (delay: number) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => ref.current?.requestSubmit(), delay);
  };
  return (
    <form ref={ref} method="get" className={className}
      onChange={(e) => submit((e.target as unknown as HTMLInputElement).type === "search" ? 400 : 0)}
      onInput={(e) => (e.target as unknown as HTMLInputElement).type === "search" && submit(400)}>
      {children}
    </form>
  );
}
