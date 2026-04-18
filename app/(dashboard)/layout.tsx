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
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden pb-16 md:pb-0">
            <TopBar />
            <PageWrapper>{children}</PageWrapper>
          </div>
        </div>
      </ToastProvider>
    </WorkspaceProvider>
  );
}
