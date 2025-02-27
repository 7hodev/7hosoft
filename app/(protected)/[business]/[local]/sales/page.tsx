"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBusiness } from "@/utils/supabase/get-business"; // Importamos la función import {
import { useSelection } from "@/contexts/SelectionProvider"; // Importamos el hook
import SelectBusiness from "@/components/selection-business";
import SelectStore from "@/components/selection-store";

import { Button } from "@/components/ui/button";

export default function StorePage() {
  
  const { selectedBusiness, selectedStore } = useSelection(); // Accedemos al contexto

  if (!selectedBusiness || !selectedStore) {
    return <div>Por favor, selecciona un negocio y una tienda.</div>;
  }

  return (
    <div>
      <h1>{selectedBusiness.name}</h1>
      <h2>{selectedStore.name}</h2>
    </div>
  );
}
