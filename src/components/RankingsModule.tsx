import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface PilotRanking {
  pilotId: string;
  pilotName: string;
  bestLapTime: number;
  averageLapTime: number;
  totalLaps: number;
  totalSessions: number;
  consistency: number;
  points: number;
}

export function RankingsModule() {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [rankingType, setRankingType] = useState<"bestLap" | "consistency" | "totalLaps">("bestLap");

  // Queries
  const pilots = useQuery(api.pilots.list, { isActive: true });
  const categories = useQuery(api.categories.getActiveCategories, {});
  const lapTimes = useQuery(api.rankings.getRankingData, {
    period: selectedPeriod,
    category: selectedCategory || undefined,
  });

  // Helper function to format lap time
  const formatLapTime = (timeInMs: number) => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    const milliseconds = timeInMs % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Calculate rankings
  const calculateRankings = (): PilotRanking[] => {
    if (!lapTimes || !pilots) return [];

    const pilotStats = new Map<string, {
      lapTimes: number[];
      sessions: Set<string>;
      pilot: any;
    }>();

    // Group lap times by pilot
    lapTimes.forEach(lapTime => {
      if (!pilotStats.has(lapTime.pilotId)) {
        const pilot = pilots.find(p => p._id === lapTime.pilotId);
        pilotStats.set(lapTime.pilotId, {
          lapTimes: [],
          sessions: new Set(),
          pilot,
        });
      }
      
      const stats = pilotStats.get(lapTime.pilotId)!;
      stats.lapTimes.push(lapTime.lapTime);
      stats.sessions.add(lapTime.sessionId);
    });

    // Calculate rankings
    const rankings: PilotRanking[] = Array.from(pilotStats.entries()).map(([pilotId, stats]) => {
      const bestLapTime = Math.min(...stats.lapTimes);
      const averageLapTime = stats.lapTimes.reduce((sum, time) => sum + time, 0) / stats.lapTimes.length;
      
      // Calculate consistency (lower standard deviation = higher consistency)
      const variance = stats.lapTimes.reduce((sum, time) => sum + Math.pow(time - averageLapTime, 2), 0) / stats.lapTimes.length;
      const standardDeviation = Math.sqrt(variance);
      const consistency = Math.max(0, 100 - (standardDeviation / averageLapTime) * 100);

      // Calculate points (simplified scoring system)
      const points = Math.round(
        (1000000 / bestLapTime) * 0.4 + // Best lap contributes 40%
        (1000000 / averageLapTime) * 0.3 + // Average lap contributes 30%
        consistency * 0.2 + // Consistency contributes 20%
        Math.min(stats.lapTimes.length, 100) * 0.1 // Total laps contributes 10% (capped at 100)
      );

      return {
        pilotId,
        pilotName: stats.pilot?.name || 'Piloto Desconhecido',
        bestLapTime,
        averageLapTime,
        totalLaps: stats.lapTimes.length,
        totalSessions: stats.sessions.size,
        consistency,
        points,
      };
    });

    // Sort by ranking type
    switch (rankingType) {
      case "bestLap":
        return rankings.sort((a, b) => a.bestLapTime - b.bestLapTime);
      case "consistency":
        return rankings.sort((a, b) => b.consistency - a.consistency);
      case "totalLaps":
        return rankings.sort((a, b) => b.totalLaps - a.totalLaps);
      default:
        return rankings.sort((a, b) => b.points - a.points);
    }
  };

  const rankings = calculateRankings();

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "today": return "Hoje";
      case "week": return "Esta Semana";
      case "month": return "Este Mês";
      case "all": return "Todos os Tempos";
      default: return "Este Mês";
    }
  };

  const getRankingTypeLabel = () => {
    switch (rankingType) {
      case "bestLap": return "Melhor Tempo";
      case "consistency": return "Consistência";
      case "totalLaps": return "Total de Voltas";
      default: return "Melhor Tempo";
    }
  };

  if (!pilots || !categories) {
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rankings</h2>
          <p className="text-gray-600 dark:text-gray-300">Classificação dos pilotos por desempenho</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Período
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="all">Todos os Tempos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name} ({category.horsepower} HP)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Ranking
            </label>
            <select
              value={rankingType}
              onChange={(e) => setRankingType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="bestLap">Melhor Tempo</option>
              <option value="consistency">Consistência</option>
              <option value="totalLaps">Total de Voltas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Podium */}
      {rankings.length >= 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
            🏆 Pódio - {getRankingTypeLabel()} ({getPeriodLabel()})
          </h3>
          <div className="flex justify-center items-end space-x-4">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="w-20 h-16 bg-gray-300 dark:bg-gray-600 rounded-t-lg flex items-center justify-center mb-2">
                <span className="text-2xl">🥈</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-bold text-gray-900 dark:text-white">{rankings[1]?.pilotName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {rankingType === "bestLap" && formatLapTime(rankings[1]?.bestLapTime)}
                  {rankingType === "consistency" && `${rankings[1]?.consistency.toFixed(1)}%`}
                  {rankingType === "totalLaps" && `${rankings[1]?.totalLaps} voltas`}
                </p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="w-24 h-20 bg-yellow-400 dark:bg-yellow-600 rounded-t-lg flex items-center justify-center mb-2">
                <span className="text-3xl">🥇</span>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
                <p className="font-bold text-gray-900 dark:text-white">{rankings[0]?.pilotName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {rankingType === "bestLap" && formatLapTime(rankings[0]?.bestLapTime)}
                  {rankingType === "consistency" && `${rankings[0]?.consistency.toFixed(1)}%`}
                  {rankingType === "totalLaps" && `${rankings[0]?.totalLaps} voltas`}
                </p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-20 h-12 bg-orange-400 dark:bg-orange-600 rounded-t-lg flex items-center justify-center mb-2">
                <span className="text-2xl">🥉</span>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-4 rounded-lg">
                <p className="font-bold text-gray-900 dark:text-white">{rankings[2]?.pilotName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {rankingType === "bestLap" && formatLapTime(rankings[2]?.bestLapTime)}
                  {rankingType === "consistency" && `${rankings[2]?.consistency.toFixed(1)}%`}
                  {rankingType === "totalLaps" && `${rankings[2]?.totalLaps} voltas`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Classificação Completa - {getRankingTypeLabel()} ({getPeriodLabel()})
          </h3>
        </div>
        
        {rankings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Posição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Piloto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Melhor Tempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tempo Médio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Consistência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Voltas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sessões
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pontos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rankings.map((ranking, index) => (
                  <tr key={ranking.pilotId} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-600 dark:text-yellow-400' :
                          index === 1 ? 'text-gray-500 dark:text-gray-400' :
                          index === 2 ? 'text-orange-600 dark:text-orange-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {index + 1}
                        </span>
                        {index < 3 && (
                          <span className="ml-2">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {ranking.pilotName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                      {formatLapTime(ranking.bestLapTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                      {formatLapTime(ranking.averageLapTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(ranking.consistency, 100)}%` }}
                          ></div>
                        </div>
                        <span>{ranking.consistency.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {ranking.totalLaps}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {ranking.totalSessions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      {ranking.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <div className="text-gray-400 text-4xl mb-4">🏆</div>
            <p>Nenhum dado de ranking encontrado</p>
            <p className="text-sm mt-1">Selecione um período ou categoria diferente</p>
          </div>
        )}
      </div>
    </div>
  );
}
