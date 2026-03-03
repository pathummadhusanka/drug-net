import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

type ChartConfig = {
	[key: string]: {
		label?: React.ReactNode;
		color?: string;
	};
};

type ChartContextProps = {
	config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
	const context = React.useContext(ChartContext);
	if (!context) {
		throw new Error("useChart must be used within a <ChartContainer />");
	}
	return context;
}

function ChartContainer({
	id,
	className,
	children,
	config,
	...props
}: React.ComponentProps<"div"> & {
	config: ChartConfig;
	children: React.ReactNode;
}) {
	const uniqueId = React.useId();
	const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
	const chartStyle = Object.entries(config).reduce(
		(acc, [key, item]) => {
			if (item?.color) {
				acc[`--color-${key}`] = item.color;
			}
			return acc;
		},
		{} as Record<string, string>,
	);

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				data-slot="chart"
				data-chart={chartId}
				className={cn(
					"[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
					className,
				)}
				style={chartStyle as React.CSSProperties}
				{...props}
			>
				<RechartsPrimitive.ResponsiveContainer>
					{children}
				</RechartsPrimitive.ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
	active,
	payload,
	className,
}: {
	active?: boolean;
	payload?: Array<{
		dataKey?: string | number;
		name?: string;
		value?: number | string;
		color?: string;
	}>;
	className?: string;
}) {
	const { config } = useChart();

	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div
			className={cn(
				"rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl",
				className,
			)}
		>
			{payload.map((item, index) => {
				const key = String(item.dataKey ?? item.name ?? "value");
				const itemConfig = config[key];
				return (
					<div
						key={index}
						className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
					>
						<div
							className="h-2 w-2 rounded-[2px]"
							style={{
								backgroundColor:
									item.color || `var(--color-${key})`,
							}}
						/>
						<span className="text-muted-foreground">
							{itemConfig?.label ?? item.name}
						</span>
						<span className="font-medium text-foreground">
							{Number(item.value ?? 0).toLocaleString()}
						</span>
					</div>
				);
			})}
		</div>
	);
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
