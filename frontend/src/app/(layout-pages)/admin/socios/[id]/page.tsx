import { redirect } from "next/navigation";

export default async function SocioIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/socios/detalle?id=${id}`);
}
