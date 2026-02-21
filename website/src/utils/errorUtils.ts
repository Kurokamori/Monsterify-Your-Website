/**
 * Extracts a user-friendly error message from various error formats.
 * Handles axios errors with backend messages, plain Errors, and unknown types.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  console.error(fallback, err);

  if (err && typeof err === 'object') {
    const axiosErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string };

    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    if (axiosErr.response?.data?.error) {
      return axiosErr.response.data.error;
    }
    if (axiosErr.message) {
      return axiosErr.message;
    }
  }

  return fallback;
}
