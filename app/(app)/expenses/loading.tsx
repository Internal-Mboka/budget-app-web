import { ListPageSkeleton } from "@/components/molecules/list-page-skeleton";

export default function ExpensesLoading() {
  return <ListPageSkeleton testId="expenses-loading-skeleton" />;
}
