import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/auth/submit-button";
import { signOutAction } from "@/app/actions";

export const AccountConfig: React.FC = () => {
  return (
    <div className="space-y-6">
      <Separator />
      <div>
        <h3 className="text-lg font-medium">Información de la Cuenta</h3>
        <p className="text-sm text-muted-foreground">
          Actualiza tu información personal
        </p>
      </div>
      <div className="w- flex justify-between">
        <form>
          <SubmitButton className="w-full" pendingText="LogOut..." formAction={signOutAction}>
            LogOut
          </SubmitButton>
        </form>
      </div>
      {/* Agregar formulario de cuenta aquí */}
    </div>
  );
}

// Componente StoreSettings (components/settings/stores.tsx)
export const StoreConfig: React.FC = () => {
  return (
    <div className="space-y-6">
      <Separator />
      <div>
        <h3 className="text-lg font-medium">Tus Tiendas</h3>
        <p className="text-sm text-muted-foreground">
          Administra tus tiendas registradas
        </p>
      </div>
      {/* Agregar lista de tiendas aquí */}
    </div>
  );
}