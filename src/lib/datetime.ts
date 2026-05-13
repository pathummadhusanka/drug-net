export const APP_TIMEZONE_STORAGE_KEY = "app.timezone";
export const APP_TIMEZONE_CHANGE_EVENT = "app-timezone-changed";

export const COMMON_APP_TIMEZONES = [
	"UTC",
	"Asia/Colombo",
	"Asia/Kolkata",
	"Asia/Dubai",
	"Asia/Singapore",
	"Asia/Tokyo",
	"Europe/London",
	"Europe/Berlin",
	"America/New_York",
	"America/Chicago",
	"America/Denver",
	"America/Los_Angeles",
	"Australia/Sydney",
];

export function getSystemTimeZone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function isValidTimeZone(timeZone: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone });
		return true;
	} catch {
		return false;
	}
}

export function getAppTimeZone(): string {
	if (typeof window === "undefined") {
		return "UTC";
	}

	const stored = window.localStorage.getItem(APP_TIMEZONE_STORAGE_KEY);
	if (stored && isValidTimeZone(stored)) {
		return stored;
	}

	return getSystemTimeZone();
}

export function setAppTimeZone(timeZone: string): boolean {
	if (!isValidTimeZone(timeZone)) {
		return false;
	}

	if (typeof window !== "undefined") {
		window.localStorage.setItem(APP_TIMEZONE_STORAGE_KEY, timeZone);
		window.dispatchEvent(
			new CustomEvent(APP_TIMEZONE_CHANGE_EVENT, {
				detail: { timeZone },
			}),
		);
	}

	return true;
}

function parseDbTimestamp(timestamp: string): Date | null {
	const value = timestamp.trim();
	if (!value) {
		return null;
	}

	const sqliteUtcPattern = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/;
	const isoNoZonePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

	let normalized = value;
	if (sqliteUtcPattern.test(value)) {
		normalized = value.replace(" ", "T") + "Z";
	} else if (isoNoZonePattern.test(value)) {
		normalized = value + "Z";
	}

	const parsed = new Date(normalized);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return parsed;
}

export function formatAuditTimestamp(
	timestamp: string | null | undefined,
	timeZone: string,
	locale: string = "en-US",
): string {
	if (!timestamp) {
		return "_";
	}

	const parsed = parseDbTimestamp(timestamp);
	if (!parsed) {
		return timestamp;
	}

	const datePart = new Intl.DateTimeFormat(locale, {
		timeZone,
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(parsed);

	const timePart = new Intl.DateTimeFormat(locale, {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	}).format(parsed);

	return `${datePart} @ ${timePart}`;
}
