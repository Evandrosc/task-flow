import { Search, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Tasks</h1>
        <nav className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium rounded-md bg-muted text-foreground">
            Lista
          </button>
          <button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Quadro
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="pl-9 pr-4 py-2 bg-muted text-sm rounded-md outline-none focus:ring-2 focus:ring-primary/50 w-64"
          />
        </div>

        <button className="p-2 hover:bg-muted rounded-md transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>

        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tarefa
        </Button>
      </div>
    </header>
  );
}
