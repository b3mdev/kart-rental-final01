import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  bookings: any[];
  availability: {
    total: number;
    available: number;
  };
}

type ViewMode = "month" | "week" | "day" | "list";

export function CalendarModule() {
  const [activeTab, setActiveTab] = useState<"calendar" | "availability" | "notifications">("calendar");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  // Queries
  const bookings = useQuery(api.bookings.list, { date: selectedDate });
  const allBookings = useQuery(api.bookings.getMonthBookings, { 
    year: currentMonth.getFullYear(), 
    month: currentMonth.getMonth() + 1 
  });
  const timeSlots = useQuery(api.timeSlots.list, { date: selectedDate });
  const notifications = useQuery(api.notifications.list, {});

  // Mutations
  const createTimeSlot = useMutation(api.timeSlots.create);
  const updateTimeSlot = useMutation(api.timeSlots.update);
  const markNotificationRead = useMutation(api.notifications.markAsRead);

  const [newTimeSlot, setNewTimeSlot] = useState({
    startTime: "",
    endTime: "",
    kartType: "rental",
    totalKarts: 3,
  });

  // Generate calendar days for month view
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = allBookings?.filter(b => b.date === dateStr) || [];
      
      days.push({
        date: dateStr,
        isCurrentMonth: date.getMonth() === month,
        isToday: dateStr === today,
        bookings: dayBookings,
        availability: {
          total: 8,
          available: Math.max(0, 8 - dayBookings.length),
        },
      });
    }
    
    return days;
  };

  // Generate week days
  const generateWeekDays = () => {
    const selectedDateObj = new Date(selectedDate);
    const startOfWeek = new Date(selectedDateObj);
    startOfWeek.setDate(selectedDateObj.getDate() - selectedDateObj.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayBookings = allBookings?.filter(b => b.date === dateStr) || [];
      
      weekDays.push({
        date: dateStr,
        dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: dateStr === new Date().toISOString().split('T')[0],
        bookings: dayBookings,
      });
    }
    
    return weekDays;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = generateWeekDays();

  const handleCreateTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTimeSlot({
        date: selectedDate,
        ...newTimeSlot,
      });
      toast.success("Horário criado com sucesso!");
      setNewTimeSlot({
        startTime: "",
        endTime: "",
        kartType: "rental",
        totalKarts: 3,
      });
    } catch (error) {
      toast.error("Erro ao criar horário");
    }
  };

  const handleUpdateAvailability = async (slotId: string, availableKarts: number) => {
    try {
      await updateTimeSlot({ id: slotId as any, availableKarts });
      toast.success("Disponibilidade atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar disponibilidade");
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await markNotificationRead({ id: notificationId as any });
    } catch (error) {
      toast.error("Erro ao marcar notificação como lida");
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const unreadNotifications = notifications?.filter(n => !n.isRead).length || 0;

  if (!bookings || !timeSlots) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Notifications */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário</h2>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              🔔
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                          !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                        onClick={() => handleMarkNotificationRead(notification._id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(notification._creationTime).toLocaleString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma notificação
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "calendar", name: "Calendário", icon: "📅" },
            { id: "availability", name: "Disponibilidade", icon: "⏰" },
            { id: "notifications", name: "Notificações", icon: "🔔" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
              {tab.id === "notifications" && unreadNotifications > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadNotifications}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* View Mode Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { id: "month", name: "Mês", icon: "📅" },
                { id: "week", name: "Semana", icon: "📊" },
                { id: "day", name: "Dia", icon: "📋" },
                { id: "list", name: "Lista", icon: "📝" },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setViewMode(view.id as ViewMode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === view.id
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span className="mr-2">{view.icon}</span>
                  {view.name}
                </button>
              ))}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (viewMode === "month") navigateMonth('prev');
                  else if (viewMode === "week") navigateWeek('prev');
                  else if (viewMode === "day") navigateDay('prev');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
              >
                ← Anterior
              </button>
              
              <div className="text-center">
                {viewMode === "month" && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                )}
                {viewMode === "week" && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Semana de {new Date(selectedDate).toLocaleDateString('pt-BR')}
                  </h3>
                )}
                {viewMode === "day" && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(selectedDate).toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                )}
                {viewMode === "list" && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Lista de Eventos
                  </h3>
                )}
              </div>

              <button
                onClick={() => {
                  if (viewMode === "month") navigateMonth('next');
                  else if (viewMode === "week") navigateWeek('next');
                  else if (viewMode === "day") navigateDay('next');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
              >
                Próximo →
              </button>
            </div>
          </div>

          {/* Month View */}
          {viewMode === "month" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Days of week header */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="p-4 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-24 p-2 border-r border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !day.isCurrentMonth ? "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500" : ""
                    } ${day.isToday ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" : ""}`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm ${day.isToday ? "font-bold text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"}`}>
                        {new Date(day.date).getDate()}
                      </span>
                      {day.bookings.length > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                          {day.bookings.length}
                        </span>
                      )}
                    </div>
                    
                    {/* Availability indicator */}
                    <div className="text-xs mb-1">
                      <div className={`w-full h-1 rounded ${
                        day.availability.available === 0 ? "bg-red-400" :
                        day.availability.available <= 2 ? "bg-yellow-400" :
                        "bg-green-400"
                      }`}></div>
                    </div>

                    {/* Bookings preview */}
                    {day.bookings.slice(0, 2).map((booking, i) => (
                      <div key={i} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded px-1 py-0.5 mt-1 truncate">
                        {booking.startTime} - {booking.pilot?.name}
                      </div>
                    ))}
                    {day.bookings.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        +{day.bookings.length - 2} mais
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === "week" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600">
                {weekDays.map((day) => (
                  <div key={day.date} className="bg-white dark:bg-gray-800">
                    <div className={`p-4 text-center border-b border-gray-200 dark:border-gray-700 ${
                      day.isToday ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-gray-700"
                    }`}>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{day.dayName}</div>
                      <div className={`text-lg ${day.isToday ? "font-bold" : "text-gray-900 dark:text-gray-100"}`}>
                        {day.dayNumber}
                      </div>
                    </div>
                    <div className="p-2 min-h-48">
                      {day.bookings.map((booking, i) => (
                        <div key={i} className="mb-2 p-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                          <div className="font-medium">{booking.startTime}</div>
                          <div className="truncate">{booking.pilot?.name}</div>
                          <div className="text-blue-600 dark:text-blue-300">{booking.kartType}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day View */}
          {viewMode === "day" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {bookings.length} agendamentos
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((booking) => (
                        <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="text-lg font-mono text-gray-600 dark:text-gray-300">
                              {booking.startTime}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{booking.pilot?.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {booking.kartType} • {booking.endTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              booking.status === "confirmed" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" :
                              booking.status === "scheduled" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" :
                              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            }`}>
                              {booking.status}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {booking.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📅</div>
                    <p className="text-gray-500 dark:text-gray-400">Nenhum agendamento para este dia</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Próximos Eventos</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {allBookings && allBookings.length > 0 ? (
                  allBookings
                    .filter(booking => booking.date >= selectedDate)
                    .sort((a, b) => {
                      const dateCompare = a.date.localeCompare(b.date);
                      return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
                    })
                    .slice(0, 20)
                    .map((booking) => (
                      <div key={booking._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(booking.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                              </div>
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {new Date(booking.date).getDate()}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(booking.date).toLocaleDateString('pt-BR', { month: 'short' })}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{booking.pilot?.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {booking.startTime} - {booking.endTime} • {booking.kartType}
                              </p>
                              {booking.notes && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{booking.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              booking.status === "confirmed" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" :
                              booking.status === "scheduled" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" :
                              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            }`}>
                              {booking.status}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {booking.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <div className="text-gray-400 text-4xl mb-4">📋</div>
                    <p>Nenhum evento encontrado</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === "availability" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <span className="text-gray-600 dark:text-gray-300">
                Gerenciar disponibilidade
              </span>
            </div>
          </div>

          {/* Create Time Slot Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Criar Novo Horário</h3>
            <form onSubmit={handleCreateTimeSlot} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Início
                </label>
                <input
                  type="time"
                  value={newTimeSlot.startTime}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fim
                </label>
                <input
                  type="time"
                  value={newTimeSlot.endTime}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo Kart
                </label>
                <select
                  value={newTimeSlot.kartType}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, kartType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="rental">Aluguel</option>
                  <option value="competition">Competição</option>
                  <option value="junior">Junior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Karts
                </label>
                <input
                  type="number"
                  value={newTimeSlot.totalKarts}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, totalKarts: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="1"
                  max="10"
                  required
                />
              </div>
              <div className="md:col-span-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Criar Horário
                </button>
              </div>
            </form>
          </div>

          {/* Time Slots List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Horários Disponíveis - {new Date(selectedDate).toLocaleDateString('pt-BR')}
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {timeSlots && timeSlots.length > 0 ? (
                timeSlots.map((slot) => (
                  <div key={slot._id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {slot.kartType} | {slot.availableKarts}/{slot.totalKarts} disponíveis
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">Disponíveis:</label>
                        <input
                          type="number"
                          value={slot.availableKarts}
                          onChange={(e) => handleUpdateAvailability(slot._id, Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          min="0"
                          max={slot.totalKarts}
                        />
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        slot.availableKarts === 0 ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" :
                        slot.availableKarts <= 1 ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" :
                        "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      }`}>
                        {slot.availableKarts === 0 ? "Esgotado" :
                         slot.availableKarts <= 1 ? "Quase esgotado" :
                         "Disponível"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  Nenhum horário configurado para esta data
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Central de Notificações</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleMarkNotificationRead(notification._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{notification.title}</h4>
                        {!notification.isRead && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                            Nova
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{new Date(notification._creationTime).toLocaleString()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          notification.type === "booking" ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" :
                          notification.type === "maintenance" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" :
                          notification.type === "system" ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200" :
                          "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        }`}>
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                Nenhuma notificação encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
