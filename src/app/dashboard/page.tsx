const stats = [
  { name: "Dipendenti totali", value: "24", change: "+2 questo mese" },
  { name: "Presenti oggi", value: "21", change: "87.5%" },
  { name: "In ferie", value: "2", change: "fino al 5 Apr" },
  { name: "Assenti", value: "1", change: "malattia" },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Panoramica del personale
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-zinc-500">{stat.name}</p>
            <p className="mt-2 text-3xl font-bold text-zinc-900">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-zinc-400">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Attività recenti
        </h2>
        <div className="mt-4 space-y-4">
          {[
            { name: "Mario Rossi", action: "ha timbrato l'ingresso", time: "08:30" },
            { name: "Laura Bianchi", action: "ha richiesto ferie", time: "08:15" },
            { name: "Giuseppe Verdi", action: "ha timbrato l'ingresso", time: "08:02" },
            { name: "Anna Neri", action: "ha inviato certificato medico", time: "07:45" },
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                  {activity.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {activity.name}
                  </p>
                  <p className="text-xs text-zinc-500">{activity.action}</p>
                </div>
              </div>
              <span className="text-xs text-zinc-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
