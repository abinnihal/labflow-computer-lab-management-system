
// Types representing Google Calendar API objects
export interface GCalEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  status?: string;
  organizer?: {
    email: string;
    displayName?: string;
  };
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
const API_KEY = process.env.GOOGLE_API_KEY || 'YOUR_API_KEY';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events.readonly";

let gapiInited = false;
let gisInited = false;
let tokenClient: any;

// Empty Mock Data
let CURRENT_EVENTS: GCalEvent[] = [];

export const initGoogleClient = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).gapi === 'undefined') {
       console.warn("Google API script not loaded. Using mock mode.");
       resolve();
       return;
    }

    if (API_KEY === 'YOUR_API_KEY') {
        console.log("Google API Key not configured (Demo Mode). Using mock data.");
        resolve();
        return;
    }

    (window as any).gapi.load('client', async () => {
      try {
        await (window as any).gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        resolve();
      } catch (error) {
        console.warn("GAPI init failed (likely invalid key), falling back to mock data.", error);
        resolve(); 
      }
    });
  });
};

export const signInToGoogle = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000);
  });
};

export const getUpcomingEvents = async (): Promise<GCalEvent[]> => {
  if (gapiInited && API_KEY !== 'YOUR_API_KEY') {
    try {
      const response = await (window as any).gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime'
      });
      return response.result.items;
    } catch (err) {
      console.warn("Failed to fetch real Google Calendar events. Using mock data.", err);
      return CURRENT_EVENTS;
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(CURRENT_EVENTS);
    }, 800);
  });
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  CURRENT_EVENTS = CURRENT_EVENTS.filter(e => e.id !== eventId);
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
};

export const formatGCalDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
