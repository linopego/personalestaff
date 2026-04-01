const stats = [
  { name: "Dipendenti totali", value: "24", change: "+2 questo mese", color: "text-blue-400" },
  { name: "Presenti oggi", value: "21", change: "87.5%", color: "text-green-400" },
  { name: "In ferie", value: "2", change: "fino al 5 Apr", color: "text-amber-400" },
  { name: "Assenti", value: "1", change: "malattia", color: "text-red-400" },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Panoramica presenze del personale</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border border-border bg-card-bg p-5">
            <p className="text-sm font-medium text-text-muted">{stat.name}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs text-text-muted">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Attività recenti */}
      <div className="mt-8 rounded-xl border border-border bg-card-bg p-6">
        <h2 className="text-lg font-semibold text-foreground">Attività recenti</h2>
        <div className="mt-4 space-y-3">
          {[
            { name: "Mario Rossi", action: "ha timbrato l'ingresso", time: "08:30", type: "in" },
            { name: "Laura Bianchi", action: "ha richiesto ferie", time: "08:15", type: "ferie" },
            { name: "Giuseppe Verdi", action: "ha timbrato l'ingresso", time: "08:02", type: "in" },
            { name: "Anna Neri", action: "ha inviato certificato medico", time: "07:45", type: "out" },
            { name: "Luca Ferrari", action: "ha timbrato l'uscita", time: "17:30", type: "out" },
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                    activity.type === "in"
                      ? "bg-green-500/10 text-green-400"
                      : activity.type === "ferie"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {activity.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.name}</p>
                  <p className="text-xs text-text-muted">{activity.action}</p>
                </div>
              </div>
              <span className="text-xs text-text-muted">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
