import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function KartsModule() {
  const [activeTab, setActiveTab] = useState<"karts" | "engines" | "parts">("karts");
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const karts = useQuery(api.karts.list, {});
  const createKart = useMutation(api.karts.create);
  const updateKart = useMutation(api.karts.update);

  const [formData, setFormData] = useState({
    number: "",
    type: "rental",
    brand: "",
    model: "",
  });

  const handleCreateKart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createKart(formData);
      toast.success("Kart criado com sucesso!");
      setShowCreateForm(false);
      setFormData({
        number: "",
        type: "rental",
        brand: "",
        model: "",
      });
    } catch (error) {
      toast.error("Erro ao criar kart");
    }
  };

  const handleStatusUpdate = async (kartId: string, status: string) => {
    try {
      await updateKart({ id: kartId as any, status });
      toast.success("Status atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (!karts) {
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
            { id: "karts", name: "Karts", icon: "🏎️" },
            { id: "engines", name: "Motores", icon: "⚙️" },
            { id: "parts", name: "Peças", icon: "🔧" },
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

      {/* Karts Tab */}
      {activeTab === "karts" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Karts ({karts.length})
              </h3>
              <div className="flex space-x-2">
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {karts.filter(k => k.status === "active").length} Ativos
                </span>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  {karts.filter(k => k.status === "maintenance").length} Manutenção
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Novo Kart
            </button>
          </div>

          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Novo Kart</h3>
                <form onSubmit={handleCreateKart} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="rental">Aluguel</option>
                      <option value="competition">Competição</option>
                      <option value="junior">Junior</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
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
                      Criar Kart
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Karts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {karts.map((kart) => (
              <div key={kart._id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Kart #{kart.number}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {kart.brand} {kart.model}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    kart.status === "active" ? "bg-green-100 text-green-800" :
                    kart.status === "maintenance" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {kart.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{kart.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horas Totais:</span>
                    <span className="font-medium">{kart.totalHours}h</span>
                  </div>
                  {kart.lastMaintenance && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última Manutenção:</span>
                      <span className="font-medium">{kart.lastMaintenance}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <select
                    value={kart.status}
                    onChange={(e) => handleStatusUpdate(kart._id, e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="active">Ativo</option>
                    <option value="maintenance">Manutenção</option>
                    <option value="retired">Aposentado</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engines Tab */}
      {activeTab === "engines" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Motores</h3>
          <p className="text-gray-600">Módulo de motores em desenvolvimento...</p>
        </div>
      )}

      {/* Parts Tab */}
      {activeTab === "parts" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peças em Estoque</h3>
          <p className="text-gray-600">Módulo de peças em desenvolvimento...</p>
        </div>
      )}
    </div>
  );
}
