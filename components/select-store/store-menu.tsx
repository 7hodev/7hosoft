"use client";

import { useState } from "react";
import { useStore } from "@/app/context/store-context";
import { createClient } from "@/utils/supabase/client";

export const StoreMenu = () => {
  const { setSelectedStore, stores, refreshStores } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("stores")
        .insert([
          {
            name: newStoreName,
            user_id: user.id,
          },
        ])
        .select();

      if (error) throw error;

      await refreshStores(); // Actualizar lista de tiendas
      setNewStoreName(""); // Limpiar campo
      setShowAddForm(false); // Cerrar formulario
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido al crear la tienda");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Tiendas
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute bg-white border rounded shadow-lg mt-2 z-50 min-w-[200px]">
          {/* Lista de tiendas */}
          <ul className="max-h-60 overflow-y-auto">
            {/* Verifica si stores existe y es un array */}
            {stores && stores.length > 0 ? (
              stores.map((store) => (
                <li
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {store.name}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">
                {loading ? "Cargando..." : "No hay tiendas"}
              </li>
            )}
          </ul>
          {/* Botón para añadir tienda */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 border-t"
            >
              + Añadir nueva tienda
            </button>
          ) : (
            /* Formulario dentro del menú */
            <form onSubmit={handleAddStore} className="p-2 border-t">
              <input
                type="text"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Nombre de la tienda"
                className="w-full p-2 border rounded mb-2 text-sm"
                disabled={loading}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-400"
                >
                  {loading ? "Creando..." : "Crear"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
              {error && <p className="mt-1 text-red-500 text-xs">{error}</p>}
            </form>
          )}
        </div>
      )}
    </div>
  );
};
