import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";

const INTENSITY_COLORS: Record<string, string> = {
  baja: "hsl(145 60% 55%)",
  media: "hsl(45 90% 55%)",
  alta: "hsl(15 80% 60%)",
};

export type AnalyticsChartsProps = {
  timeline: { fecha: string; rating: number }[];
  intensityData: { name: string; value: number }[];
  lastEight: { name: string; cumplido: number; no: number }[];
};

/** Bloque pesado de gráficos: se carga bajo demanda (code splitting). */
export default function AnalyticsCharts({ timeline, intensityData, lastEight }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">Rating por sesión</h2>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="rating" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">Distribución de intensidad percibida</h2>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={intensityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {intensityData.map((d, i) => (
                  <Cell key={i} fill={INTENSITY_COLORS[d.name] ?? "hsl(var(--muted))"} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 lg:col-span-2">
        <h2 className="mb-3 font-semibold">Últimas 8 sesiones · objetivos</h2>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lastEight}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="cumplido" stackId="a" fill="hsl(145 60% 55%)" />
              <Bar dataKey="no" stackId="a" fill="hsl(15 80% 60%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
