import React from "react";
import SocioLayoutShell from "@/components/layout/socio-layout-shell";

export default function SocioLayout({ children }: { children: React.ReactNode }) {
  return <SocioLayoutShell>{children}</SocioLayoutShell>;
}
