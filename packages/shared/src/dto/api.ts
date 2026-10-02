export type ListDto<T> = { item: T[] };

export type ApiErrorBody = {
  statusCode: number;
  timestamp: string;
  message: string;
  details: { body?: Record<string, string[] | undefined> } | null;
};
