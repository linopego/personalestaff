export default function TimbraPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-4">
        <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a48.667 48.667 0 0 0-1.418 8.773 1.497 1.497 0 0 0 1.357 1.678c.223.023.447.043.672.06a.5.5 0 0 0 .473-.28l1.176-2.352a.5.5 0 0 1 .673-.225A23.887 23.887 0 0 0 12 20.073c1.476 0 2.91-.186 4.292-.543a.5.5 0 0 1 .52.147l1.71 1.962a.5.5 0 0 0 .514.14c.225-.065.449-.133.672-.205a1.5 1.5 0 0 0 .96-1.727A48.82 48.82 0 0 1 19.5 10.5c0-1.862-.677-3.567-1.8-4.877" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-foreground">Timbra</h1>
      <p className="mt-2 text-sm text-text-muted text-center">
        Registra la tua entrata e uscita dal turno.
      </p>
    </div>
  );
}
