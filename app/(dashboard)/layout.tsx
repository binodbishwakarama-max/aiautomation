import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import PageWrapper from "@/components/layout/PageWrapper";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <ToastProvider>
        <div className="relative flex flex-col md:flex-row h-[100dvh] w-full max-w-full overflow-hidden bg-[#08080c]">
          <Sidebar />
          <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden pb-16 md:pb-0 z-10">
            <TopBar />
            <PageWrapper>{children}</PageWrapper>
          </div>
        </div>
      </ToastProvider>
    </WorkspaceProvider>
  );
}
