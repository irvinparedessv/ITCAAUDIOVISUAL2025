import ProtectedRoute from "~/helpers/ProtectedRoute";
import FormEspacio from "../components/FormEspacio";

export default function FormEspacioPage() {
  return (
      <ProtectedRoute>
        <FormEspacio />
      </ProtectedRoute>
    );
  
}
