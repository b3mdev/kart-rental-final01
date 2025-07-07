import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function MyLapsIntegration() {
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [importData, setImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [importMode, setImportMode] = useState<"text" | "files">("text");
  
  const sessions = useQuery(api.raceSessions.list, { isActive: true });
  const pilots = useQuery(api.pilots.list, {});
  const importLapTimes = useMutation(api.lapTimes.importFromMyLaps);

  const parseCSVData = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    const lapData = [];

    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      if (columns.length < 9) continue;

      const [pos, startNumber, competitor, classType, diff, laps, bestLap, bestLapNo, bestSpeed] = columns;
      
      // Skip entries without valid lap times
      if (!bestLap || bestLap === "0.000" || bestLap === "-") continue;

      // Parse best lap time (formato MM:SS.sss)
      const timeMatch = bestLap.match(/(\d+):(\d+)\.(\d+)/);
      if (!timeMatch) continue;

      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      const milliseconds = parseInt(timeMatch[3]);
      const totalMilliseconds = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;

      // Encontrar piloto pelo número do kart ou criar um genérico
      let pilot = pilots?.find(p => 
        p.name.toLowerCase().includes(startNumber) || 
        p.name.toLowerCase().includes(`kart ${startNumber}`) ||
        p.name.toLowerCase().includes(`#${startNumber}`)
      );

      // Se não encontrar piloto, criar um nome genérico baseado no número
      if (!pilot && pilots && pilots.length > 0) {
        // Usar o primeiro piloto como fallback ou criar um nome genérico
        const pilotName = competitor && competitor.trim() ? competitor.trim() : `Piloto Kart #${startNumber}`;
        pilot = pilots.find(p => p.name.toLowerCase().includes(pilotName.toLowerCase()));
        
        if (!pilot) {
          // Usar o primeiro piloto disponível como fallback
          pilot = pilots[Math.min(parseInt(pos) - 1, pilots.length - 1)] || pilots[0];
        }
      }

      if (!pilot) {
        console.warn(`Nenhum piloto encontrado para o kart #${startNumber}`);
        continue;
      }

      lapData.push({
        pilotId: pilot._id,
        kartNumber: startNumber.trim(),
        lapNumber: parseInt(bestLapNo) || 1,
        lapTime: totalMilliseconds,
        sector1: undefined,
        sector2: undefined,
        sector3: undefined,
        timestamp: new Date().toISOString(),
      });
    }

    return lapData;
  };

  const handleImportData = async () => {
    if (!selectedSession) {
      toast.error("Selecione uma sessão primeiro");
      return;
    }

    if (importMode === "text" && !importData.trim()) {
      toast.error("Cole os dados do MyLaps na área de texto");
      return;
    }

    if (importMode === "files" && (!selectedFiles || selectedFiles.length === 0)) {
      toast.error("Selecione pelo menos um arquivo CSV");
      return;
    }

    setIsImporting(true);
    try {
      let allLapData: any[] = [];

      if (importMode === "text") {
        // Parse text data
        const lapData = parseCSVData(importData);
        allLapData = lapData;
      } else {
        // Parse multiple files
        const filePromises = Array.from(selectedFiles!).map(file => {
          return new Promise<any[]>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const csvContent = e.target?.result as string;
                const lapData = parseCSVData(csvContent);
                resolve(lapData);
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = () => reject(new Error(`Erro ao ler arquivo: ${file.name}`));
            reader.readAsText(file);
          });
        });

        const fileResults = await Promise.all(filePromises);
        allLapData = fileResults.flat();
      }

      if (allLapData.length === 0) {
        toast.error("Nenhum dado válido encontrado. Verifique o formato dos dados.");
        return;
      }

      await importLapTimes({
        sessionId: selectedSession as any,
        lapData: allLapData,
      });

      const fileCount = importMode === "files" ? selectedFiles!.length : 1;
      toast.success(`${allLapData.length} tempos importados de ${fileCount} arquivo(s) com sucesso!`);
      
      // Reset form
      setImportData("");
      setSelectedFiles(null);
      if (document.getElementById('file-input')) {
        (document.getElementById('file-input') as HTMLInputElement).value = '';
      }
    } catch (error) {
      toast.error("Erro ao importar dados do MyLaps");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const sampleData = `Pos,Start Number,Competitor,Class,Diff,Laps,Best Lap,Best Lap No.,Best Speed
1,22,,INDOOR,0.000,2,1:22.327,2,66.335 km/h
2,16,,INDOOR,0.158,3,1:22.485,2,66.208 km/h
3,78,,INDOOR,1.450,2,1:23.777,2,65.187 km/h
4,19,,INDOOR,1.822,3,1:24.149,3,64.899 km/h
5,24,,INDOOR,2.766,2,1:25.093,2,64.179 km/h
6,39,,INDOOR,3.549,3,1:25.876,2,63.594 km/h
7,31,,INDOOR,4.633,2,1:26.960,1,62.801 km/h
8,25,,INDOOR,5.251,2,1:27.578,2,62.358 km/h
9,1,,INDOOR,7.349,2,1:29.676,2,60.899 km/h
10,6,,INDOOR,7.929,2,1:30.256,2,60.508 km/h`;

  if (!sessions || !pilots) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔗 Integração MyLaps
        </h3>
        <p className="text-gray-600 mb-6">
          Importe resultados de corrida diretamente do sistema MyLaps.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sessão de Corrida
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma sessão ativa</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.sessionId} - {session.date} ({session.sessionType})
                </option>
              ))}
            </select>
          </div>

          {/* Import Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Importação
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="text"
                  checked={importMode === "text"}
                  onChange={(e) => setImportMode(e.target.value as "text" | "files")}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Colar Texto</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="files"
                  checked={importMode === "files"}
                  onChange={(e) => setImportMode(e.target.value as "text" | "files")}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Arquivos CSV</span>
              </label>
            </div>
          </div>

          {/* Text Import */}
          {importMode === "text" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dados do MyLaps (Resultados da Corrida)
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={12}
                placeholder="Cole aqui os resultados exportados do MyLaps..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato esperado: Pos,Start Number,Competitor,Class,Diff,Laps,Best Lap,Best Lap No.,Best Speed
              </p>
            </div>
          )}

          {/* File Import */}
          {importMode === "files" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arquivos CSV do MyLaps
              </label>
              <input
                id="file-input"
                type="file"
                accept=".csv,.txt"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Selecione um ou múltiplos arquivos CSV exportados do MyLaps
              </p>
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 font-medium">
                    {selectedFiles.length} arquivo(s) selecionado(s):
                  </p>
                  <ul className="text-xs text-gray-600 mt-1">
                    {Array.from(selectedFiles).map((file, index) => (
                      <li key={index} className="truncate">• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleImportData}
              disabled={isImporting || !selectedSession || 
                (importMode === "text" && !importData.trim()) ||
                (importMode === "files" && (!selectedFiles || selectedFiles.length === 0))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isImporting ? "Importando..." : 
               importMode === "files" ? "Importar Arquivos" : "Importar Resultados"}
            </button>
            {importMode === "text" && (
              <button
                onClick={() => setImportData(sampleData)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Usar Dados de Exemplo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          📋 Como usar a integração MyLaps:
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Crie uma sessão de corrida no módulo "Sessões"</li>
          <li>2. Escolha entre colar texto ou importar arquivos CSV</li>
          <li>3. Para múltiplos arquivos: selecione todos os CSVs de uma vez</li>
          <li>4. Clique em "Importar" para processar os dados</li>
          <li>5. Os melhores tempos serão associados aos pilotos por número do kart</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">
          ⚠️ Importante:
        </h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Os pilotos devem estar cadastrados no sistema antes da importação</li>
          <li>• O sistema tentará associar pilotos pelo número do kart</li>
          <li>• Formato de tempo esperado: MM:SS.sss (ex: 1:22.327)</li>
          <li>• Múltiplos arquivos serão processados e combinados em uma única importação</li>
          <li>• Se não encontrar piloto específico, usará pilotos cadastrados em ordem</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">
          ✅ Formato de dados suportado:
        </h4>
        <div className="text-sm text-green-700">
          <p className="mb-2">O sistema aceita dados no formato de resultados do MyLaps com as colunas:</p>
          <code className="bg-white px-2 py-1 rounded text-xs">
            Pos, Start Number, Competitor, Class, Diff, Laps, Best Lap, Best Lap No., Best Speed
          </code>
          <p className="mt-2">Onde "Best Lap" deve estar no formato MM:SS.sss</p>
          <p className="mt-1 font-medium">💡 Novidade: Agora você pode importar múltiplos arquivos CSV de uma só vez!</p>
        </div>
      </div>
    </div>
  );
}
