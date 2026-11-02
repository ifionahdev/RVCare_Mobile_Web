import { format, isSameDay, addMonths, subMonths } from "date-fns";

const statusColors = {
  Pending: "bg-yellow-300 text-yellow-800",  
  Upcoming: "bg-pink-300 text-pink-800",   
  Completed: "bg-green-300 text-green-800",
  Cancelled: "bg-red-300 text-red-800",
  Missed: "bg-gray-300 text-gray-800",
};

const visitTypeColors = {
  Scheduled: "bg-blue-100 text-blue-800 border border-blue-200",
  "Walk-in": "bg-purple-100 text-purple-800 border border-purple-200",
};

const statusDotColors = {
  Pending: "bg-yellow-400",
  Upcoming: "bg-pink-400",
  Completed: "bg-green-400",
  Cancelled: "bg-red-400",
  Missed: "bg-gray-400",
};

const visitTypeDotColors = {
  Scheduled: "bg-blue-400",
  "Walk-in": "bg-purple-400",
};

const toEventDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const CalendarTab = ({ 
  currentMonth, 
  setCurrentMonth, 
  selectedDate, 
  setSelectedDate, 
  appointments, 
  visits 
}) => {
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDayOfWeek = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();

  const daysInMonth = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysInMonth.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    daysInMonth.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const dayAppointments = appointments.filter((a) => {
    const eventDate = toEventDate(a.date);
    return eventDate ? isSameDay(eventDate, selectedDate) : false;
  });
  const dayVisits = visits.filter((v) => {
    const eventDate = toEventDate(v.date);
    return eventDate ? isSameDay(eventDate, selectedDate) : false;
  });

  return (
    <div className="flex gap-6 h-[calc(100%-130px)]">
      {/* Calendar Panel */}
      <div className="w-3/5 flex flex-col">
        <div className="bg-[#F4F7F8] rounded-3xl shadow-md p-5 flex flex-col gap-2 h-full border border-[#E8F7FA]">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-semibold text-gray-700">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="px-3 py-1 rounded-lg bg-[#E6FCFF] hover:bg-[#D8F9FF] text-gray-700 transition"
              >
                Prev
              </button>
              <button
                onClick={nextMonth}
                className="px-3 py-1 rounded-lg bg-[#E6FCFF] hover:bg-[#D8F9FF] text-gray-700 transition"
              >
                Next
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 text-center font-medium text-xs text-gray-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2 flex-1">
            {daysInMonth.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} />;
              }

              const dayApps = appointments.filter((a) => {
                const eventDate = toEventDate(a.date);
                return eventDate ? isSameDay(eventDate, day) : false;
              });
              const dayVisits = visits.filter((v) => {
                const eventDate = toEventDate(v.date);
                return eventDate ? isSameDay(eventDate, day) : false;
              });
              const totalEvents = [...dayApps, ...dayVisits];
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const hasManyEvents = totalEvents.length >= 4;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative flex flex-col items-center justify-start min-h-[55px] p-2 cursor-pointer transition-all rounded-xl border
                    ${
                      isSelected
                        ? "bg-[#DDF9FF] border-[#5EE6FE] shadow-lg"
                        : isToday
                        ? "border-[#C7F5FF] bg-[#F9FEFF]"
                        : "border-transparent hover:border-[#DFF9FF]"
                    }
                  `}
                >
                  <span className="text-[12px] font-medium text-gray-700">
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-wrap justify-center mt-1 gap-1 w-full">
                    {totalEvents.slice(0, hasManyEvents ? 6 : 4).map((event, idx) => (
                      <span
                        key={idx}
                        className={`rounded-full border border-white shadow-sm ${
                          hasManyEvents 
                            ? "h-2 w-2"
                            : "h-3 w-3"
                        } ${
                          event.status
                            ? (statusDotColors[event.status] || "bg-gray-400")
                            : (visitTypeDotColors[event.visitType] || "bg-gray-400")
                        }`}
                        title={`${event.petName} - ${event.status || event.visitType || "Event"}`}
                      />
                    ))}
                    {hasManyEvents && totalEvents.length > 6 && (
                      <span 
                        className="h-2 w-2 bg-gray-400 rounded-full border border-white"
                        title={`+${totalEvents.length - 6} more events`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-2/5 flex flex-col gap-4">
        <div className="bg-gradient-to-br from-[#F9FEFF] to-[#EAFBFF] rounded-3xl p-5 shadow-md border border-[#E1F8FF] flex flex-col gap-4 h-full">
          <h3 className="font-semibold text-base text-gray-700">
            Events on {format(selectedDate, "MMMM d, yyyy")}
          </h3>

          <div className="flex flex-col gap-3 overflow-y-auto">
            {dayAppointments.length === 0 && dayVisits.length === 0 ? (
              <p className="text-gray-400 text-center mt-4 text-sm">
                No events for this day.
              </p>
            ) : (
              <>
                {dayAppointments.map(a => (
                  <div
                    key={a.id}
                    className="p-4 rounded-2xl bg-white shadow-sm border border-[#E6F7FA] hover:shadow-md transition-transform transform hover:scale-[1.02] flex justify-between items-center"
                  >
                    <div className="flex flex-col">
                      <p className="font-semibold text-gray-700 text-sm">{a.petName}</p>
                      <p className="text-gray-500 text-xs">Owner: {a.owner}</p>
                      <p className="text-gray-400 text-xs mt-1">{a.time} (Appointment)</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[a.status]}`}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
                {dayVisits.map(v => (
                  <div
                    key={v.id}
                    className="p-4 rounded-2xl bg-white shadow-sm border border-[#E6F7FA] hover:shadow-md transition-transform transform hover:scale-[1.02] flex justify-between items-center"
                  >
                    <div className="flex flex-col">
                      <p className="font-semibold text-gray-700 text-sm">{v.petName}</p>
                      <p className="text-gray-500 text-xs">Owner: {v.owner}</p>
                      <p className="text-gray-400 text-xs mt-1">{v.time} (Visit)</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${visitTypeColors[v.visitType]}`}
                    >
                      {v.visitType}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTab;
