import { Eye, X } from "lucide-react";
import { CaseWithDetails } from "@/lib/cases";

interface AttachedCasesListProps {
	attachedCases: CaseWithDetails[];
	onViewCase: (caseItem: CaseWithDetails) => void | Promise<void>;
	onRemoveCase?: (caseItem: CaseWithDetails) => void;
	emptyMessage?: string;
}

export function AttachedCasesList({
	attachedCases,
	onViewCase,
	onRemoveCase,
	emptyMessage = "No cases attached yet",
}: AttachedCasesListProps) {
	return (
		<div className="space-y-2">
			<div className="min-h-12 rounded-md border bg-white p-2">
				{attachedCases.length === 0 ? (
					<p className="text-sm text-gray-500">{emptyMessage}</p>
				) : (
					<div className="space-y-2">
						{attachedCases.map((caseItem) => (
							<div
								key={caseItem.id}
								className="rounded-md border bg-white px-3 py-2"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-3 text-xs text-gray-500">
											<span className="font-medium text-gray-900">
												Case ID:{" "}
												{caseItem.case_id || "N/A"}
											</span>
											<span className="shrink-0">
												Last updated:{" "}
												{caseItem.updated_at ||
													"Unknown"}
											</span>
										</div>
										<div className="text-sm text-gray-700 truncate mt-1">
											{caseItem.case_name}
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<button
											type="button"
											aria-label={`View ${caseItem.case_id || "case"} information`}
											title="View case information"
											onClick={() =>
												void onViewCase(caseItem)
											}
											className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-muted hover:text-gray-700"
										>
											<Eye className="h-4 w-4" />
										</button>
										{onRemoveCase && (
											<button
												type="button"
												aria-label={`Remove ${caseItem.case_id || "case"}`}
												onClick={() =>
													onRemoveCase(caseItem)
												}
												className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-muted hover:text-gray-700"
											>
												<X className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
