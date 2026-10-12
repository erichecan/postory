import { getNailsWorkspace } from "@/lib/nails/workspace";
import { getAppointmentsForOwner } from "@/lib/db/appointments";
import { todayInZone } from "@/lib/nails/time";
import { AppointmentsView } from "@/components/nails/appointments-view";

export default async function AppointmentsPage({ searchParams }: PageProps<"/nails/appointments">) {
  const { user, studio } = await getNailsWorkspace();
  const params = await searchParams;
  const view = params.view === "week" ? "week" : "day";
  const requestedDate = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayInZone(studio.timeZone);
  const data = await getAppointmentsForOwner(user.id, requestedDate, view);
  return <AppointmentsView
    studioName={studio.name}
    timeZone={studio.timeZone}
    localDate={data.localDate}
    dates={data.dates}
    view={data.view}
    hours={data.businessHours}
    duration={studio.defaultDurationMinutes}
    appointments={data.appointments}
    closedPeriods={data.closedPeriods}
    availability={data.availabilityByDate}
  />;
}
