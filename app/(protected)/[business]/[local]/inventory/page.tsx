import { createClient } from "@/utils/supabase/server";

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

// Ejemplo de cómo actualizar base de datos auth supabase
/*
const { data } = await supabase.auth.updateUser({
  data: { display_name: "Jhonnar" } 
  // Cambia esto por el nombre del usuario
});
*/

  return (
    <div>
        <h1>Inventory</h1>
    </div>
  );
}
