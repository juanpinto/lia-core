export function ok<T>(data: T) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data),
      },
    ],
    structuredContent: data,
  };
}

export function fail(code: string, message: string, details?: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          error: {
            code,
            message,
            details: details ?? null,
          },
        }),
      },
    ],
    isError: true,
  };
}
