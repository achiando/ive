import { getAllConsumableAllocations } from "@/lib/actions/consumable-allocation";
import { ConsumableAllocationsPageClient } from "./_components/ConsumableAllocationsPageClient";

export default async function ConsumableAllocationsPage() {
  const allocations = await getAllConsumableAllocations();

  return <ConsumableAllocationsPageClient allocations={allocations} />;
}
