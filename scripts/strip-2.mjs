import { readFileSync, writeFileSync } from "node:fs";

function rep(p, a, b) {
  let s = readFileSync(p, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  const A = a.split("\n").join(nl);
  if (!s.includes(A)) {
    console.log("MISS", p, "|", a.slice(0, 60));
    return;
  }
  s = s.split(A).join((b ?? "").split("\n").join(nl));
  writeFileSync(p, s);
  console.log("OK", p);
}

// layout.tsx: quitar ProductIdentity (identidad de producto gastronómico)
rep("src/app/(app)/layout.tsx", 'import { ProductIdentity } from "@/components/product-identity";\n', "");
rep("src/app/(app)/layout.tsx", "      <ProductIdentity />\n", "");

// sales: quitar selector de mesa en modal de cuenta + usos de descuentos
rep("src/app/(app)/sales/page.tsx", 'import { CashierTableTiles } from "@/components/tables/cashier-table-tiles";\n', "");
rep(
  "src/app/(app)/sales/page.tsx",
  `                {showTables && (
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Mesa</p>
                    <CashierTableTiles
                      tables={tablesPage?.results ?? []}
                      selectedId={selectedTableId || null}
                      hideUnavailable
                      onSelect={(t) => setSelectedTableId(t ? String(t.id) : "")}
                    />
                  </div>
                )}

`,
  "",
);
rep("src/app/(app)/sales/page.tsx", 'import { fetchDiscountUsages } from "@/lib/api/discounts";\n', "");

// dashboard: quitar card de Productos y su query
rep("src/app/(app)/dashboard/page.tsx", 'import { useProducts } from "@/lib/hooks/useCatalog";\n', "");
rep("src/app/(app)/dashboard/page.tsx", "  const { data: products = [] } = useProducts(!!branch);\n", "");
