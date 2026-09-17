import { LoadoutEditor } from "@/components/LoadoutEditor";
import { sampleLoadout } from "@/data/loadouts/sample";

export default function Page() {
  return <LoadoutEditor initial={sampleLoadout} />;
}
