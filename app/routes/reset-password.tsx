import { Toaster } from "react-hot-toast";
import ResetPassword from "app/components/auth/ResetPassword";

export default function ResetPasswordPage() {
  return (
    <>
      <Toaster position="top-right" />
      <ResetPassword />
    </>
  );
}
