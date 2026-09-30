import { readFileSync, writeFileSync } from "node:fs";

function edit(p, pairs) {
  let s = readFileSync(p, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  for (const [a, b] of pairs) {
    const A = a.split("\n").join(nl);
    if (!s.includes(A)) {
      console.log("MISS", p, "|", a.slice(0, 60));
      continue;
    }
    s = s.replace(A, (b ?? "").split("\n").join(nl));
  }
  writeFileSync(p, s);
  console.log("OK", p);
}

// 1) customers hub: quitar query y card de promociones
edit("src/app/(app)/customers/page.tsx", [
  ['import { fetchDiscountDashboard } from "@/lib/api/discounts";\n', ""],
  [
    `  const promotionsDashboardQuery = useQuery({
    queryKey: ["discounts", "hub-kpi"],
    queryFn: () => fetchDiscountDashboard(),
    enabled: canManage,
    staleTime: 45_000,
  });
`,
    "",
  ],
  [
    `          <StatCard
            variant="compact"
            label="Promos Activas"
            value={promotionsDashboardQuery.data?.summary?.active_discounts ?? 0}
            sub={\`\${promotionsDashboardQuery.data?.summary?.total_discounts ?? 0} promociones\`}
            icon={Percent}
            tone="success"
            href="/promotions/discounts"
          />
`,
    "",
  ],
]);

// 2) sidebar: quitar query de tickets de cocina y badge kitchenReady
edit("src/components/app-sidebar/app-sidebar.tsx", [
  ['import { fetchKitchenTickets } from "@/lib/api/kitchen";\n', ""],
  [
    `  const { data: kitchenTickets = [] } = useQuery({
    queryKey: ["kitchen-tickets", "READY"],
    queryFn: () => fetchKitchenTickets({ status: "READY" }),
    refetchInterval: 30_000,
  });
`,
    "",
  ],
]);
