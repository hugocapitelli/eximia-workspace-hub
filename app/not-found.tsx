import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-display font-bold text-accent mb-2">
          404
        </h1>
        <p className="text-muted mb-6">Página não encontrada</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
        >
          Voltar ao Workspace
        </Link>
      </div>
    </div>
  );
}
