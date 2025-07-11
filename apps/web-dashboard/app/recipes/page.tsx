'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  Users
} from 'lucide-react';

interface Ingredient {
  id: number;
  name: string;
  category: string;
  unit: string;
  costPerUnit: number;
}

interface RecipeIngredient {
  id: number;
  ingredientId: number;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

interface Recipe {
  id: number;
  name: string;
  description: string;
  category: string;
  preparationTime: number;
  servings: number;
  cost: number;
  instructions: string;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    preparationTime: 0,
    servings: 1,
    instructions: '',
    ingredients: [] as {
      ingredientId: number;
      quantity: number;
      unit: string;
    }[]
  });

  const categories = [
    'Напитки',
    'Горячие блюда',
    'Холодные блюда',
    'Десерты',
    'Закуски',
    'Супы',
    'Салаты'
  ];

  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/v1/recipes');
      const data = await response.json();
      if (data.success) {
        setRecipes(data.data);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/v1/ingredients');
      const data = await response.json();
      if (data.success) {
        setIngredients(data.data);
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleCreateRecipe = async () => {
    try {
      const response = await fetch('/api/v1/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setRecipes([data.data, ...recipes]);
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
    }
  };

  const handleUpdateRecipe = async () => {
    if (!editingRecipe) return;

    try {
      const response = await fetch(`/api/v1/recipes/${editingRecipe.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setRecipes(
          recipes.map(r => (r.id === editingRecipe.id ? data.data : r))
        );
        setEditingRecipe(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот рецепт?')) return;

    try {
      const response = await fetch(`/api/v1/recipes/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setRecipes(recipes.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      preparationTime: 0,
      servings: 1,
      instructions: '',
      ingredients: []
    });
  };

  const addIngredientToForm = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { ingredientId: 0, quantity: 0, unit: '' }
      ]
    });
  };

  const updateFormIngredient = (index: number, field: string, value: any) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value
    };
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  const removeFormIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      description: recipe.description,
      category: recipe.category,
      preparationTime: recipe.preparationTime,
      servings: recipe.servings,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients.map(ri => ({
        ingredientId: ri.ingredientId,
        quantity: ri.quantity,
        unit: ri.unit
      }))
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Рецепты</h1>
          <p className="text-gray-600">Управление рецептами и ингредиентами</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Новый рецепт
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск рецептов..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Все категории</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <div
            key={recipe.id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {recipe.name}
                  </h3>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {recipe.category}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(recipe)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {recipe.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recipe.preparationTime} мин
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {recipe.servings} порций
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {recipe.cost.toFixed(2)} сум
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2">
                  Ингредиенты ({recipe.ingredients.length}):
                </p>
                <div className="space-y-1">
                  {recipe.ingredients.slice(0, 3).map(ri => (
                    <div key={ri.id} className="text-xs text-gray-600">
                      {ri.ingredient.name} - {ri.quantity} {ri.unit}
                    </div>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{recipe.ingredients.length - 3} еще...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Рецепты не найдены</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRecipe) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingRecipe ? 'Редактировать рецепт' : 'Новый рецепт'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Категория
                    </label>
                    <select
                      value={formData.category}
                      onChange={e =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Время (мин)
                    </label>
                    <input
                      type="number"
                      value={formData.preparationTime}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          preparationTime: parseInt(e.target.value)
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Порций
                    </label>
                    <input
                      type="number"
                      value={formData.servings}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          servings: parseInt(e.target.value)
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Инструкции
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={e =>
                      setFormData({ ...formData, instructions: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Ингредиенты
                    </label>
                    <button
                      type="button"
                      onClick={addIngredientToForm}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Добавить ингредиент
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={ingredient.ingredientId}
                          onChange={e =>
                            updateFormIngredient(
                              index,
                              'ingredientId',
                              parseInt(e.target.value)
                            )
                          }
                          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={0}>Выберите ингредиент</option>
                          {ingredients.map(ing => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Количество"
                          value={ingredient.quantity}
                          onChange={e =>
                            updateFormIngredient(
                              index,
                              'quantity',
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Единица"
                          value={ingredient.unit}
                          onChange={e =>
                            updateFormIngredient(index, 'unit', e.target.value)
                          }
                          className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeFormIngredient(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRecipe(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={
                    editingRecipe ? handleUpdateRecipe : handleCreateRecipe
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRecipe ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
