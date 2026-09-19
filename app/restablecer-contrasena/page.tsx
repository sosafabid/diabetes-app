import { Suspense } from "react";
import RestablecerContrasenaForm from "./RestablecerContrasenaForm";

export default function RestablecerContrasenaPage() {
  return (
    <Suspense fallback={null}>
      <RestablecerContrasenaForm />
    </Suspense>
  );
}