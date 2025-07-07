import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function DashboardStats() {
  const stats = useQuery(api.transactions.getDashboardStats);
  const todayBookings = useQuery(api.bookings.list, { 
    date: new Date().toISOString().split('T')[0] 
  });
  const activeKarts = useQuery(api.karts.list, { status: "active" });
  const activePilots = useQuery(api.pilots.list, { isActive: true });
  const setupSampleData = useMutation(api.sampleData.setupSampleData);

  const handleSetupSampleData = async () => {
    try {
      const result = await setupSampleData({});
      toast.success(result);
    } catch (error) {
      toast.error("Erro ao criar dados de exemplo");
    }
  };

  if (!stats || !todayBookings || !activeKarts || !activePilots) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Receita Hoje",
      value: `R$ ${stats.todayRevenue.toFixed(2)}`,
      icon: "💰",
      color: "bg-green-500",
    },
    {
      title: "Receita do Mês",
      value: `R$ ${stats.monthRevenue.toFixed(2)}`,
      icon: "📈",
      color: "bg-blue-500",
    },
    {
      title: "Corridas Hoje",
      value: todayBookings.length.toString(),
      icon: "🏁",
      color: "bg-purple-500",
    },
    {
      title: "Karts Ativos",
      value: activeKarts.length.toString(),
      icon: "🏎️",
      color: "bg-orange-500",
    },
    {
      title: "Pilotos Cadastrados",
      value: activePilots.length.toString(),
      icon: "👤",
      color: "bg-indigo-500",
    },
    {
      title: "Pagamentos Pendentes",
      value: stats.pendingTransactions.toString(),
      icon: "⏳",
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sample Data Button */}
      {(!activePilots || activePilots.length === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Sistema vazio - Dados de exemplo
              </h3>
              <p className="text-sm text-blue-600 mt-1">
                Clique para popular o sistema com dados de exemplo para testar as funcionalidades.
              </p>
            </div>
            <button
              onClick={handleSetupSampleData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Dados de Exemplo
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agendamentos de Hoje</h3>
          <div className="space-y-3">
            {todayBookings.slice(0, 5).map((booking) => (
              <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{booking.pilot?.name}</p>
                  <p className="text-sm text-gray-600">{booking.startTime} - {booking.endTime}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                  booking.status === "scheduled" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
            {todayBookings.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum agendamento para hoje</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Karts em Manutenção</h3>
          <div className="space-y-3">
            {activeKarts
              .filter(kart => kart.status === "maintenance")
              .slice(0, 5)
              .map((kart) => (
                <div key={kart._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Kart #{kart.number}</p>
                    <p className="text-sm text-gray-600">{kart.brand} {kart.model}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Manutenção
                  </span>
                </div>
              ))}
            {activeKarts.filter(kart => kart.status === "maintenance").length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum kart em manutenção</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
