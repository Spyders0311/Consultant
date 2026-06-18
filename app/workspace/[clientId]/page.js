import { redirect } from 'next/navigation';

export default async function WorkspaceIndexPage({ params }) {
  const { clientId } = await params;
  redirect(`/workspace/${clientId}/overview`);
}
