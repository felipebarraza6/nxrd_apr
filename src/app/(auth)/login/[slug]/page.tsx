import { LoginSlugRedirect } from "./login-slug-redirect";

// Exportación estática (deploy por FTP): una instancia por cada demo
// conocida (para que dev y la exportación resuelvan /login/<slug>) más el
// placeholder "__"; .htaccess (post-export.mjs) reescribe cualquier otro
// /login/<slug> a esta página y el cliente redirige a /login?branch=<slug>.
export function generateStaticParams() {
  return [{ slug: "__" }];
}

export default function Page() {
  return <LoginSlugRedirect />;
}
