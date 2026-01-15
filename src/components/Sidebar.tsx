import { Home, CheckSquare, Users, FolderOpen, PanelLeftClose, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: Home, label: 'Início', active: false },
  { icon: CheckSquare, label: 'Tasks', active: true },
  { icon: Users, label: 'Equipes', active: false },
  { icon: FolderOpen, label: 'Documentos', active: false },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!isCollapsed && (
          <span className="font-semibold text-sidebar-foreground">TaskFlow</span>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <PanelLeftClose
            className={cn(
              'h-5 w-5 text-sidebar-foreground transition-transform',
              isCollapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
              item.active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <Plus className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Criar</span>}
        </button>
      </div>

      <div className="p-2 border-t border-sidebar-border">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
            'text-sidebar-foreground hover:bg-sidebar-accent/50'
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm">Configurações</span>}
        </button>
      </div>
    </aside>
  );
}
