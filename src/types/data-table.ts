export type DataTableFetchParams<TFilters = Record<string, unknown>> = {
  filters?: TFilters;
  keyword: string;
  page: number;
  pageSize: number;
  searchTypes?: string[];
};

export type DataTableFetchResult<TData> = {
  data: TData[];
  totalItems: number;
};
