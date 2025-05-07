import { ProtectedRoute } from '../helpers/ProtectedRoute';
import FormEquipo from "../components/FormEquipo";

export default function FormEquipoPage() {
  return (
    <ProtectedRoute>
      <FormEquipo />
    </ProtectedRoute>
  );
}
