"use client";

import { useEffect, useState } from "react";
import { dbService, AppUser } from "@/lib/db-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/app/context/store-context"; 

export default function DashboardPage() {
  const { selectedStore } = useStore();

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await dbService.getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formElements = e.currentTarget.elements as typeof e.currentTarget.elements & {
        displayName: HTMLInputElement;
        phone: HTMLInputElement;
      };

      const updatedUser = await dbService.updateUserProfile({
        display_name: formElements.displayName.value,
        phone: formElements.phone.value
      });
      setUser(updatedUser);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Cargando...</div>;

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
      <div>
      {user.display_name || ""}
      </div>
    </div>
  );
}