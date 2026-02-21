type State = 'loading' | 'error' | 'empty' | 'success';

/**
 * Helper function to determine state from common async patterns
 */
export const getContainerState = (options: {
  loading: boolean;
  error?: string | Error | null;
  data?: unknown[] | null;
  isEmpty?: boolean;
}): State => {
  const { loading, error, data, isEmpty } = options;

  if (loading) return 'loading';
  if (error) return 'error';

  // Check for empty state
  if (isEmpty !== undefined) {
    return isEmpty ? 'empty' : 'success';
  }

  // If data is an array, check if it's empty
  if (Array.isArray(data)) {
    return data.length === 0 ? 'empty' : 'success';
  }

  return 'success';
};

