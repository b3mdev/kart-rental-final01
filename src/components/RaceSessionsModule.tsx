import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function RaceSessionsModule() {
  const [activeTab, setActiveTab] = useState<"sessions" | "laptimes" | "rankings">("sessions");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const sessions = useQuery(api.raceSessions.list, { date: selectedDate });
  const bestLaps = useQuery(api.lapTimes.getBestLaps, { limit: 20 });
  const createSession = useMutation(api.raceSessions.create);
  const updateSessionStatus = useMutation(api.raceSessions.updateStatus);

  const [formData, setFormData] = useState({
    sessionId: "",
    startTime: "",
    endTime: "",
    trackCondition: "dry",
    weather: "",
    sessionType: "practice",
  });

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSession({
        ...formData,
        date: selectedDate,
        weather: formData.weather || undefined,
      });
      toast.success("Sessão criada com sucesso!");
      setShowCreateForm(false);
      setFormData({
        sessionId: "",
        startTime: "",
        endTime: "",
        trackCondition: "dry",
        weather: "",
        sessionType: "practice",
      });
    } catch (error) {
      toast.error("Erro ao criar sessão");
    }
  };

  const handleToggleSession = async (sessionId: string, isActive: boolean) => {
    try {
      await updateSessionStatus({ id: sessionId as any, isActive: !isActive });
      toast.success(`Sessão ${!isActive ? "ativada" : "desativada"}!`);
    } catch (error) {
      toast.error("Erro ao atualizar sessão");
    }
  };

  if (!sessions || !bestLaps) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "sessions", name: "Sessões", icon: "🏁" },
            { id: "laptimes", name: "Tempos de Volta", icon: "⏱️" },
            { id: "rankings", name: "Rankings", icon: "🏆" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-600">
                {sessions.length} sessão(ões) encontrada(s)
              </span>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nova Sessão
            </button>
          </div>

          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Nova Sessão de Corrida</h3>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID da Sessão (MyLaps)
                    </label>
                    <input
                      type="text"
                      value={formData.sessionId}
                      onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="Ex: SESSION_001"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horário Início
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horário Fim
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Sessão
                    </label>
                    <select
                      value={formData.sessionType}
                      onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="practice">Treino Livre</option>
                      <option value="qualifying">Classificatória</option>
                      <option value="race">Corrida</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condição da Pista
                    </label>
                    <select
                      value={formData.trackCondition}
                      onChange={(e) => setFormData({ ...formData, trackCondition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dry">Seca</option>
                      <option value="wet">Molhada</option>
                      <option value="damp">Úmida</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clima (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.weather}
                      onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Ensolarado, 25°C"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Criar Sessão
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div key={session._id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {session.sessionId}
                    </h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {session.sessionType}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    session.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {session.isActive ? "Ativa" : "Finalizada"}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horário:</span>
                    <span className="font-medium">{session.startTime} - {session.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pista:</span>
                    <span className="font-medium capitalize">{session.trackCondition}</span>
                  </div>
                  {session.weather && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clima:</span>
                      <span className="font-medium">{session.weather}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex space-x-2">
                  <button
                    onClick={() => handleToggleSession(session._id, session.isActive)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      session.isActive 
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {session.isActive ? "Finalizar" : "Reativar"}
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma sessão encontrada para esta data
            </div>
          )}
        </div>
      )}

      {/* Lap Times Tab */}
      {activeTab === "laptimes" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tempos de Volta Recentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Piloto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kart
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessão
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bestLaps.slice(0, 10).map((lapTime, index) => (
                  <tr key={lapTime._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        index === 0 ? "bg-yellow-100 text-yellow-800" :
                        index === 1 ? "bg-gray-100 text-gray-800" :
                        index === 2 ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lapTime.pilot?.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600">
                        {(lapTime.lapTime / 1000).toFixed(3)}s
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{lapTime.kartNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lapTime.session?.sessionId}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lapTime.session?.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rankings Tab */}
      {activeTab === "rankings" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top 10 Melhores Tempos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bestLaps.slice(0, 10).map((lapTime, index) => (
                <div key={lapTime._id} className={`p-4 rounded-lg border-2 ${
                  index === 0 ? "border-yellow-300 bg-yellow-50" :
                  index === 1 ? "border-gray-300 bg-gray-50" :
                  index === 2 ? "border-orange-300 bg-orange-50" :
                  "border-blue-200 bg-blue-50"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-2xl font-bold ${
                      index === 0 ? "text-yellow-600" :
                      index === 1 ? "text-gray-600" :
                      index === 2 ? "text-orange-600" :
                      "text-blue-600"
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {(lapTime.lapTime / 1000).toFixed(3)}s
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{lapTime.pilot?.name}</p>
                    <p className="text-gray-600">Kart #{lapTime.kartNumber}</p>
                    <p className="text-gray-500">{lapTime.session?.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
