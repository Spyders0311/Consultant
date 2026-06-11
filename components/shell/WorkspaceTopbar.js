'use client';

import Breadcrumbs from '@/components/shell/Breadcrumbs';
import SignOutButton from '@/components/shell/SignOutButton';
import Icon from '@/components/ui/Icon';

export default function WorkspaceTopbar({ clientId, clientName, sheetNames, userEmail, onMenuToggle }) {
  return (
    <header className="app-topbar">
      <button
        type="button"
        className="topbar-menu-btn"
        onClick={onMenuToggle}
        aria-label="Toggle navigation"
      >
        <Icon name="menu" size={18} />
      </button>
      <Breadcrumbs clientId={clientId} clientName={clientName} sheetNames={sheetNames} />
      <div className="topbar-spacer" />
      {userEmail ? <span className="topbar-user">{userEmail}</span> : null}
      <SignOutButton />
    </header>
  );
}
