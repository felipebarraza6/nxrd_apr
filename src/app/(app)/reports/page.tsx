import { redirect } from "next/navigation";

/** `/reports` redirige al informe de cobros (ruta canónica APR). */
export default function ReportsIndexPage() {
  redirect("/reports/sales");
}
