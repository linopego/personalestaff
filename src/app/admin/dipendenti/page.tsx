export default function DipendentiPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dipendenti</h1>
          <p className="mt-1 text-sm text-text-muted">Gestione anagrafica del personale</p>
        </div>
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent-hover transition-colors">
          + Aggiungi
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <input
            type="text"
            placeholder="Cerca dipendente..."
            className="w-full max-w-xs rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Ruolo</th>
              <th className="px-5 py-3 font-medium">Reparto</th>
              <th className="px-5 py-3 font-medium">Sede</th>
              <th className="px-5 py-3 font-medium">Stato</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Mario Rossi", role: "Cameriere", dept: "Sala", sede: "La Casa dei Gelsi", status: "Attivo" },
              { name: "Laura Bianchi", role: "Barista", dept: "Bar", sede: "Tenuta Villa Peggy's", status: "In ferie" },
              { name: "Giuseppe Verdi", role: "Responsabile sala", dept: "Sala", sede: "La Casa dei Gelsi", status: "Attivo" },
              { name: "Anna Neri", role: "Cassiera", dept: "Cassa", sede: "Studios Club / TooLate", status: "Malattia" },
              { name: "Luca Ferrari", role: "Barman", dept: "Bar", sede: "Studios Club / TooLate", status: "Attivo" },
            ].map((emp, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                      {emp.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="text-sm font-medium text-foreground">{emp.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-text-muted">{emp.role}</td>
                <td className="px-5 py-4 text-sm text-text-muted">{emp.dept}</td>
                <td className="px-5 py-4 text-sm text-text-muted">{emp.sede}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      emp.status === "Attivo"
                        ? "bg-green-500/10 text-green-400"
                        : emp.status === "In ferie"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
