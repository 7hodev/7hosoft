"use client";

import { useStore } from "@/app/context/store-context"; 

export default function InventoryPage() {
  const { selectedStore } = useStore();

  return (
    <div className="p-8">
      {!selectedStore ? (
        <div className="mt-4 p-4 border rounded max-w-md">
          <h2 className="text-xl font-bold mb-4">Crear Nueva Tienda</h2>
        </div>
      ) : (
        <div className="mt-4 p-4 border rounded">
          <h2 className="text-xl font-bold">{selectedStore.name}</h2>
          <p>ID: {selectedStore.id}</p>
        </div>
      )}
    </div>
  );
}