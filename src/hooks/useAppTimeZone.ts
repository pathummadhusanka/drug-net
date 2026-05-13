import { useEffect, useState } from "react";
import { APP_TIMEZONE_CHANGE_EVENT, getAppTimeZone } from "@/lib/datetime";

export function useAppTimeZone(): string {
	const [timeZone, setTimeZone] = useState(getAppTimeZone);

	useEffect(() => {
		const onTimezoneChanged = () => {
			setTimeZone(getAppTimeZone());
		};

		window.addEventListener(APP_TIMEZONE_CHANGE_EVENT, onTimezoneChanged);
		window.addEventListener("storage", onTimezoneChanged);

		return () => {
			window.removeEventListener(
				APP_TIMEZONE_CHANGE_EVENT,
				onTimezoneChanged,
			);
			window.removeEventListener("storage", onTimezoneChanged);
		};
	}, []);

	return timeZone;
}
