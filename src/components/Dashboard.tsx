import { useState } from "react";
import { SignOutButton } from "../SignOutButton";
import { ThemeToggle } from "./ThemeToggle";
import { DashboardStats } from "./DashboardStats";
import { PilotsModule } from "./PilotsModule";
import { BookingsModule } from "./BookingsModule";
import { CalendarModule } from "./CalendarModule";
import { KartsModule } from "./KartsModule";
import { RaceSessionsModule } from "./RaceSessionsModule";
import { FinancialModule } from "./FinancialModule";
import { CheckInModule } from "./CheckInModule";
import { MyLapsIntegration } from "./MyLapsIntegration";
import { CategoriesModule } from "./CategoriesModule";
import { LapTimesModule } from "./LapTimesModule";
import { RankingsModule } from "./RankingsModule";
import { PopulateDbButton } from "./PopulateDbButton";

export type ActiveModule = 
  | "dashboard" 
  | "checkin"
  | "pilots" 
  | "bookings" 
  | "calendar" 
  | "categories"
  | "karts" 
  | "sessions" 
  | "laptimes"
  | "rankings"
  | "financial" 
  | "mylaps";

type MenuSection = {
  id: string;
  name: string;
  icon: string;
  items?: { id: ActiveModule; name: string; icon: string }[];
};

export function Dashboard() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("dashboard");
  const [expandedSections, setExpandedSections] = useState<string[]>(["reservas", "mylaps"]);

  const menuSections: MenuSection[] = [
    { id: "dashboard", name: "Dashboard", icon: "📊" },
    { id: "checkin", name: "Check-in", icon: "✅" },
    { id: "pilots", name: "Pilotos", icon: "👥" },
    {
      id: "reservas",
      name: "RESERVAS",
      icon: "📋",
      items: [
        { id: "bookings", name: "Agendamentos", icon: "📅" },
        { id: "calendar", name: "Calendário", icon: "🗓️" },
        { id: "categories", name: "Categorias", icon: "🏷️" },
      ]
    },
    { id: "karts", name: "Karts", icon: "🏎️" },
    {
      id: "mylaps",
      name: "MYLAPS",
      icon: "⏱️",
      items: [
        { id: "sessions", name: "Sessões", icon: "🏁" },
        { id: "laptimes", name: "Tempos de Volta", icon: "⏰" },
        { id: "rankings", name: "Rankings", icon: "🏆" },
        { id: "mylaps", name: "Integração", icon: "🔗" },
      ]
    },
    { id: "financial", name: "Financeiro", icon: "💰" },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <DashboardStats />;
      case "checkin":
        return <CheckInModule />;
      case "pilots":
        return <PilotsModule />;
      case "bookings":
        return <BookingsModule />;
      case "calendar":
        return <CalendarModule />;
      case "categories":
        return <CategoriesModule />;
      case "karts":
        return <KartsModule />;
      case "sessions":
        return <RaceSessionsModule />;
      case "laptimes":
        return <LapTimesModule />;
      case "rankings":
        return <RankingsModule />;
      case "mylaps":
        return <MyLapsIntegration />;
      case "financial":
        return <FinancialModule />;
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              🏎️ KartTrack
            </h1>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuSections.map((section) => (
              <div key={section.id}>
                {section.items ? (
                  // Section with sub-items
                  <div>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-lg">{section.icon}</span>
                        <span className="text-sm font-bold tracking-wide">{section.name}</span>
                      </div>
                      <span className={`transform transition-transform duration-200 ${
                        expandedSections.includes(section.id) ? "rotate-90" : ""
                      }`}>
                        ▶
                      </span>
                    </button>
                    
                    {/* Sub-items */}
                    {expandedSections.includes(section.id) && (
                      <div className="ml-4 mt-2 space-y-1">
                        {section.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setActiveModule(item.id)}
                            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors duration-200 ${
                              activeModule === item.id
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            <span className="mr-3 text-sm">{item.icon}</span>
                            <span className="text-sm">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular menu item
                  <button
                    onClick={() => setActiveModule(section.id as ActiveModule)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                      activeModule === section.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="mr-3 text-lg">{section.icon}</span>
                    <span className="font-medium">{section.name}</span>
                  </button>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="p-8">
          {renderActiveModule()}
        </div>
      </div>
    </div>
  );
}
