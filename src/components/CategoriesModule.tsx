import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Category {
  _id: string;
  name: string;
  horsepower: number;
  description?: string;
  pricePerSession: number;
  isActive: boolean;
  _creationTime: number;
}

export function CategoriesModule() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Queries
  const categories = useQuery(api.categories.list, {});

  // Mutations
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);

  const [formData, setFormData] = useState({
    name: "",
    horsepower: 5,
    description: "",
    pricePerSession: 50,
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      horsepower: 5,
      description: "",
      pricePerSession: 50,
      isActive: true,
    });
    setEditingCategory(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id as any,
          ...formData,
        });
      } else {
        await createCategory(formData);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      horsepower: category.horsepower,
      description: category.description || "",
      pricePerSession: category.pricePerSession,
      isActive: category.isActive,
    });
    setEditingCategory(category);
    setShowCreateForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await deleteCategory({ id: categoryId as any });
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      await updateCategory({
        id: category._id as any,
        name: category.name,
        horsepower: category.horsepower,
        description: category.description || "",
        pricePerSession: category.pricePerSession,
        isActive: !category.isActive,
      });
    } catch (error) {
      console.error("Error updating category status:", error);
    }
  };

  if (!categories) {
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias de Kart</h2>
          <p className="text-gray-600 dark:text-gray-300">Gerencie as categorias de kart com diferentes potências e preços</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Categoria
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Categoria
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Ex: Kart Infantil"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Potência (HP)
              </label>
              <select
                value={formData.horsepower}
                onChange={(e) => setFormData({ ...formData, horsepower: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={5}>5 HP</option>
                <option value={8.5}>8.5 HP</option>
                <option value={13}>13 HP</option>
                <option value={15}>15 HP</option>
                <option value={20}>20 HP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preço por Sessão (R$)
              </label>
              <input
                type="number"
                value={formData.pricePerSession}
                onChange={(e) => setFormData({ ...formData, pricePerSession: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Categoria ativa</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Descrição da categoria..."
              />
            </div>

            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCategory ? "Atualizar" : "Criar"} Categoria
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Categorias Cadastradas ({categories.length})
          </h3>
        </div>
        
        {categories.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category) => (
              <div key={category._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h4>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                        {category.horsepower} HP
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        category.isActive 
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      }`}>
                        {category.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {category.description || "Sem descrição"}
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>💰 R$ {category.pricePerSession.toFixed(2)} por sessão</span>
                      <span>📅 Criado em {new Date(category._creationTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleStatus(category)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        category.isActive
                          ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800"
                          : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                      }`}
                    >
                      {category.isActive ? "Desativar" : "Ativar"}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(category)}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      Editar
                    </button>
                    
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <div className="text-gray-400 text-4xl mb-4">🏷️</div>
            <p>Nenhuma categoria cadastrada</p>
            <p className="text-sm mt-1">Clique em "Nova Categoria" para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
