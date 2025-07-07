import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface LapTime {
  _id: string;
  sessionId: string;
  pilotId: string;
  kartNumber: string;
  lapNumber: number;
  lapTime: number;
  sector1?: number;
  sector2?: number;
  sector3?: number;
  timestamp: string;
  _creationTime: number;
  pilot?: {
    name: string;
    _id: string;
  };
  session?: {
    sessionId: string;
    date: string;
    sessionType: string;
  };
}

export function LapTimesModule() {
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedPilot, setSelectedPilot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<"all" | "session" | "pilot">("all");

  // Queries
  const lapTimes = useQuery(api.lapTimes.list, {
    sessionId: selectedSession ? (selectedSession as any) : undefined,
    pilotId: selectedPilot ? (selectedPilot as any) : undefined,
    date: selectedDate,
  });
  const sessions = useQuery(api.raceSessions.list, { date: selectedDate });
  const pilots = useQuery(api.pilots.list, { isActive: true });

  // Helper function to format lap time
  const formatLapTime = (timeInMs: number) => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    const milliseconds = timeInMs % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Helper function to get best lap time for a pilot
  const getBestLapTime = (pilotId: string) => {
    if (!lapTimes) return null;
    const pilotLaps = lapTimes.filter(lap => lap.pilotId === pilotId);
    if (pilotLaps.length === 0) return null;
    return Math.min(...pilotLaps.map(lap => lap.lapTime));
  };

  // Helper function to get average lap time for a pilot
  const getAverageLapTime = (pilotId: string) => {
    if (!lapTimes) return null;
    const pilotLaps = lapTimes.filter(lap => lap.pilotId === pilotId);
    if (pilotLaps.length === 0) return null;
    const total = pilotLaps.reduce((sum, lap) => sum + lap.lapTime, 0);
    return total / pilotLaps.length;
  };

  if (!lapTimes || !sessions || !pilots) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tempos de Volta</h2>
          <p className="text-gray-600 dark:text-gray-300">Análise detalhada dos tempos de volta dos pilotos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Modo de Visualização
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todos os Tempos</option>
              <option value="session">Por Sessão</option>
              <option value="pilot">Por Piloto</option>
            </select>
          </div>

          {viewMode === "session" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sessão
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Todas as Sessões</option>
                {sessions.map((session) => (
                  <option key={session._id} value={session._id}>
                    {session.sessionId} - {session.sessionType}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === "pilot" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Piloto
              </label>
              <select
                value={selectedPilot}
                onChange={(e) => setSelectedPilot(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Todos os Pilotos</option>
                {pilots.map((pilot) => (
                  <option key={pilot._id} value={pilot._id}>
                    {pilot.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {lapTimes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-xl">🏁</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Voltas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{lapTimes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-xl">⚡</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Melhor Tempo</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatLapTime(Math.min(...lapTimes.map(lap => lap.lapTime)))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatLapTime(lapTimes.reduce((sum, lap) => sum + lap.lapTime, 0) / lapTimes.length)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400 text-xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pilotos Únicos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(lapTimes.map(lap => lap.pilotId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lap Times Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tempos de Volta ({lapTimes.length})
          </h3>
        </div>
        
        {lapTimes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Piloto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kart
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Volta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Setor 1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Setor 2
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Setor 3
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sessão
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {lapTimes
                  .sort((a, b) => a.lapTime - b.lapTime)
                  .map((lapTime, index) => {
                    const isBestLap = index === 0;
                    return (
                      <tr key={lapTime._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isBestLap ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {lapTime.pilot?.name || 'Piloto Desconhecido'}
                              </div>
                            </div>
                            {isBestLap && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                🏆 Melhor
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          #{lapTime.kartNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {lapTime.lapNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-mono ${isBestLap ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {formatLapTime(lapTime.lapTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                          {lapTime.sector1 ? formatLapTime(lapTime.sector1) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                          {lapTime.sector2 ? formatLapTime(lapTime.sector2) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                          {lapTime.sector3 ? formatLapTime(lapTime.sector3) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {lapTime.session?.sessionId || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <div className="text-gray-400 text-4xl mb-4">⏱️</div>
            <p>Nenhum tempo de volta encontrado</p>
            <p className="text-sm mt-1">Selecione uma data ou sessão diferente</p>
          </div>
        )}
      </div>
    </div>
  );
}
