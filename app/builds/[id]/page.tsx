import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoadoutEditor } from "@/components/LoadoutEditor";
import { BUILDS_BY_ID, CURATED_BUILDS } from "@/data/builds";

/** Every curated build is prerendered; any other id is a 404, not a fallback. */
export const dynamicParams = false;

export const generateStaticParams = () =>
  CURATED_BUILDS.map((build) => ({ id: build.id }));

type Props = { params: Promise<{ id: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const build = BUILDS_BY_ID.get((await params).id);
  return build ? { title: `${build.loadout.name} — Division 2 Character View` } : {};
};

export default async function BuildPage({ params }: Props) {
  const build = BUILDS_BY_ID.get((await params).id);
  if (!build) notFound();
  // Keyed by id so switching builds resets the editor instead of carrying edits over.
  return <LoadoutEditor key={build.id} build={build} />;
}
