"use client";

import type { ReactNode } from "react";

export function ConfirmForm({
  action,
  message,
  children,
  className,
}: Readonly<{
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
}>) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        // Native confirmation gives destructive server-action forms a blocking
        // decision without pretending that a client-only modal is authoritative.
        // eslint-disable-next-line no-alert
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
