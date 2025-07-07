import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function PilotsModule() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const pilots = useQuery(api.pilots.list, 
    selectedCategory === "all" ? {} : { category: selectedCategory }
  );
  const createPilot = useMutation(api.pilots.create);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    category: "adult",
    kartTypes: ["rental"],
    emergencyContact: "",
    emergencyPhone: "",
    medicalInfo: "",
  });

  const handleCreatePilot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPilot({
        ...formData,
        medicalInfo: formData.medicalInfo || undefined,
      });
      toast.success("Piloto cadastrado com sucesso!");
      setShowCreateForm(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        birthDate: "",
        category: "adult",
        kartTypes: ["rental"],
        emergencyContact: "",
        emergencyPhone: "",
        medicalInfo: "",
      });
    } catch (error) {
      toast.error("Erro ao cadastrar piloto");
    }
  };

  if (!pilots) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categories = [
    { value: "all", label: "Todos" },
    { value: "junior", label: "Junior" },
    { value: "adult", label: "Adulto" },
    { value: "senior", label: "Senior" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <span className="text-gray-600">
            {pilots.length} piloto(s) encontrado(s)
          </span>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Novo Piloto
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Novo Piloto</h3>
            <form onSubmit={handleCreatePilot} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="junior">Junior</option>
                  <option value="adult">Adulto</option>
                  <option value="senior">Senior</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contato de Emergência
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone de Emergência
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Informações Médicas (opcional)
                </label>
                <textarea
                  value={formData.medicalInfo}
                  onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Alergias, medicamentos, condições especiais..."
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
                  Cadastrar Piloto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pilots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pilots.map((pilot) => (
          <div key={pilot._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {pilot.name}
                </h4>
                <p className="text-sm text-gray-600">{pilot.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                pilot.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {pilot.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Categoria:</span>
                <span className="font-medium capitalize">{pilot.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telefone:</span>
                <span className="font-medium">{pilot.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total de Corridas:</span>
                <span className="font-medium">{pilot.totalRaces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cadastro:</span>
                <span className="font-medium">{pilot.registrationDate}</span>
              </div>
            </div>

            {pilot.bestLapTime && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Melhor Volta:</span>
                    <span className="font-medium text-blue-600">
                      {(pilot.bestLapTime / 1000).toFixed(3)}s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {pilots.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum piloto encontrado
        </div>
      )}
    </div>
  );
}
