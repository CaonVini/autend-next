import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
};

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-[#f5f1ec] px-3 py-3 sm:px-4 sm:py-4 lg:px-4 lg:py-3">
      {children}
    </div>
  );
}
