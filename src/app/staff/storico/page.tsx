export default function StoricoPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-4">
        <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-foreground">Storico Timbrature</h1>
      <p className="mt-2 text-sm text-text-muted text-center">
        Visualizza le tue timbrature passate.
      </p>
    </div>
  );
}
