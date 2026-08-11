// Google Calendar and .ics file utilities for Inspection Bookings

export function getGoogleCalendarUrl(event: {
  title: string;
  description: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  timeSlot?: string;  // e.g. "10:00 AM - 11:00 AM" or "14:00"
}) {
  const dateObj = new Date(event.startDate || Date.now());
  
  if (event.timeSlot) {
    const firstPart = event.timeSlot.split('-')[0].trim();
    const match = firstPart.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const mins = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3];
      if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      dateObj.setHours(hours, mins, 0, 0);
    }
  } else {
    dateObj.setHours(10, 0, 0, 0); // Default 10am
  }

  const formatIso = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const startIso = formatIso(dateObj);
  const endObj = new Date(dateObj.getTime() + 60 * 60 * 1000); // 1 hr duration
  const endIso = formatIso(endObj);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[Dormiqa Hostel Inspection] ${event.title}`,
    details: `${event.description}\n\nBooked via Dormiqa Housing Platform.`,
    location: event.location,
    dates: `${startIso}/${endIso}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile(event: {
  title: string;
  description: string;
  location: string;
  startDate: string;
  timeSlot?: string;
}) {
  const dateObj = new Date(event.startDate || Date.now());
  if (event.timeSlot) {
    const firstPart = event.timeSlot.split('-')[0].trim();
    const match = firstPart.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const mins = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3];
      if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      dateObj.setHours(hours, mins, 0, 0);
    }
  } else {
    dateObj.setHours(10, 0, 0, 0);
  }

  const formatIso = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const startIso = formatIso(dateObj);
  const endObj = new Date(dateObj.getTime() + 60 * 60 * 1000);
  const endIso = formatIso(endObj);

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dormiqa//Hostel Inspection Calendar//EN',
    'BEGIN:VEVENT',
    `SUMMARY:Dormiqa Inspection: ${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `inspection_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
