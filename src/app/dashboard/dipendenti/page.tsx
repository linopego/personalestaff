export default function DipendentiPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dipendenti</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestione anagrafica del personale
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <input
            type="text"
            placeholder="Cerca dipendente..."
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            + Aggiungi
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-sm text-zinc-500">
              <th className="px-6 py-3 font-medium">Nome</th>
              <th className="px-6 py-3 font-medium">Ruolo</th>
              <th className="px-6 py-3 font-medium">Reparto</th>
              <th className="px-6 py-3 font-medium">Stato</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Mario Rossi", role: "Sviluppatore", dept: "IT", status: "Attivo" },
              { name: "Laura Bianchi", role: "Designer", dept: "Marketing", status: "In ferie" },
              { name: "Giuseppe Verdi", role: "Project Manager", dept: "IT", status: "Attivo" },
              { name: "Anna Neri", role: "HR Specialist", dept: "HR", status: "Malattia" },
            ].map((emp, i) => (
              <tr key={i} className="border-b border-zinc-100 last:border-0">
                <td className="px-6 py-4 text-sm font-medium text-zinc-900">{emp.name}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">{emp.role}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">{emp.dept}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      emp.status === "Attivo"
                        ? "bg-green-100 text-green-700"
                        : emp.status === "In ferie"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
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
