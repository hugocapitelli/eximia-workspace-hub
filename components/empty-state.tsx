import Link from "next/link";
import { Plus, LayoutGrid } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-elevated flex items-center justify-center mb-6">
        <LayoutGrid className="w-8 h-8 text-muted" />
      </div>
      <h2 className="text-lg font-display font-semibold mb-2">
        Seu workspace está vazio
      </h2>
      <p className="text-sm text-muted mb-8 max-w-sm">
        Adicione seus sistemas, ferramentas e plataformas para acessar tudo em
        um só lugar.
      </p>
      <Link
        href="/apps/new"
        className="flex items-center gap-2 px-5 py-2.5 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Adicionar primeiro sistema
      </Link>
    </div>
  );
}
