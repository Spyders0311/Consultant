'use client';

import { usePathname } from 'next/navigation';
import WorkspaceBreadcrumbs from '@/components/WorkspaceBreadcrumbs';
import { resolveWorkspaceBreadcrumbTrail } from '@/lib/workspace/breadcrumbTrail';

/**
 * @param {{ clientId: string, clientName: string }} props
 */
export default function WorkspaceBreadcrumbTrail({ clientId, clientName }) {
  const pathname = usePathname() || '';
  const trail = resolveWorkspaceBreadcrumbTrail(pathname);

  return <WorkspaceBreadcrumbs clientId={clientId} clientName={clientName} trail={trail} />;
}
