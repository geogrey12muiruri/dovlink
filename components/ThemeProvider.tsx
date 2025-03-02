"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);

  // Set mounted to true after the component mounts on the client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Only render children when mounted to avoid server-client mismatch
  if (!mounted) {
    return <div>{children}</div>; // Render children without theme logic on server
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}