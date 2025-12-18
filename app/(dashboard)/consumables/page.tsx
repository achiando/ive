import { getAllConsumables } from "@/lib/actions/consumable";
import { ConsumablesPageClient } from "./_components/ConsumablesPageClient";

export default async function ConsumablesPage() {
  const consumables = await getAllConsumables();

  return <ConsumablesPageClient consumables={consumables} />;
}
