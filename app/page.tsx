import { LoadoutEditor } from "@/components/LoadoutEditor";
import { DEFAULT_BUILD } from "@/data/builds";

export default function Page() {
  return <LoadoutEditor key={DEFAULT_BUILD.id} build={DEFAULT_BUILD} />;
}
