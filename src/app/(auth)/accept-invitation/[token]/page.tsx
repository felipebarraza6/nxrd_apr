import ResetPasswordPage from "../../reset-password/[token]/reset-password-client";

// Exportación estática: una instancia "__" y .htaccess reescribe
// /accept-invitation/<token> (incluso con %2B) a esa página.
export function generateStaticParams() {
  return [{ token: "__" }];
}

export default function Page() {
  return <ResetPasswordPage />;
}
