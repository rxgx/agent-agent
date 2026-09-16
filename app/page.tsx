import { LoadoutScreen } from "@/components/LoadoutScreen";
import { sampleLoadout } from "@/data/loadouts/sample";

export default function Page() {
  return <LoadoutScreen loadout={sampleLoadout} />;
}
