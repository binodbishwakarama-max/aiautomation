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
        <div className="relative flex flex-col md:flex-row h-screen overflow-hidden bg-[#07070a]">
          {/* Ambient Background Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[130px] animate-float-slow-1 pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] animate-float-slow-2 pointer-events-none" />

          <Sidebar />
          <div className="relative flex flex-col flex-1 overflow-hidden pb-16 md:pb-0 z-10">
            <TopBar />
            <PageWrapper>{children}</PageWrapper>
          </div>
        </div>
      </ToastProvider>
    </WorkspaceProvider>
  );
}
