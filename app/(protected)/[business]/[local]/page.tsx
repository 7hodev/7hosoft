import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/logout-button";

export default async function DashboardPage() {
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
    </div>
  );
}
