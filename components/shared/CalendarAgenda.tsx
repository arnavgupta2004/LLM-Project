"use client";

import {
  CalendarEventItem,
  eventTypeLabel,
  eventTypeStyle,
  formatEventDateTime,
  groupEventsByDay,
} from "@/lib/calendar";

interface Props {
  events: CalendarEventItem[];
  emptyTitle: string;
  emptyBody: string;
}

export default function CalendarAgenda({ events, emptyTitle, emptyBody }: Props) {
  const groups = groupEventsByDay(events);

  if (events.length === 0) {
    return (
      <div
        className="rounded-2xl border-2 border-dashed p-10 text-center"
        style={{ borderColor: "#d8e1f0", background: "#fafbff" }}
      >
        <p className="text-4xl mb-3">📅</p>
        <p className="text-base font-bold" style={{ color: "#1a2b5e" }}>
          {emptyTitle}
        </p>
        <p className="text-sm text-gray-400 mt-1">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.date}>
          <div className="mb-3">
            <p className="text-sm font-bold" style={{ color: "#1a2b5e" }}>
              {new Date(group.date + "T12:00:00").toLocaleDateString("en", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="space-y-3">
            {group.items.map((event) => {
              const style = eventTypeStyle(event.type);
              return (
                <div
                  key={event.id}
                  className="rounded-2xl border p-4"
                  style={{ borderColor: "#e5eaf5", background: "#ffffff" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span
                          className="text-[10px] font-bold px-2 py-1 rounded-full"
                          style={{ background: style.bg, color: style.color }}
                        >
                          {eventTypeLabel(event.type)}
                        </span>
                        {event.courseCode && (
                          <span
                            className="text-[10px] font-bold px-2 py-1 rounded-full"
                            style={{ background: "#eef1f9", color: "#1a2b5e" }}
                          >
                            {event.courseCode}
                          </span>
                        )}
                        {event.status && (
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                            {event.status}
                          </span>
                        )}
                      </div>
                      <p className="text-base font-bold" style={{ color: "#1a2b5e" }}>
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatEventDateTime(event.startAt, event.endAt)}
                      </p>
                      {(event.subtitle || event.courseName || event.location) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {event.subtitle ?? event.courseName}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
