"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Users, Settings, Wifi } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Conversations", href: "/conversations", icon: MessageSquare },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] bg-surface/40 border-r border-white/5 backdrop-blur-xl h-full text-textPrimary shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-primary bg-clip-text text-transparent flex items-center gap-2 tracking-tight">
            ReplySync<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 active:scale-95 ${
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-glow-primary" 
                    : "text-textMuted border border-transparent hover:bg-white/5 hover:border-white/5 hover:text-textPrimary"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="font-medium text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-center gap-2.5 px-4 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
            <Wifi size={14} className="animate-pulse" />
            <span className="text-xs font-semibold tracking-wide uppercase">System Active</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav (Floating Glass Bar) */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-surface/75 border border-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-around p-2 z-50 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)] pb-safe">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-300 active:scale-90 ${
                isActive 
                  ? "text-primary bg-primary/10 border border-primary/15" 
                  : "text-textMuted hover:text-textPrimary"
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] font-semibold tracking-wide">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
