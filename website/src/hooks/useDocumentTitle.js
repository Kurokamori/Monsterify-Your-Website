import { useEffect, useRef } from 'react';

/**
 * Custom hook to manage document title
 * @param {string} title - The title to set for the document
 * @param {boolean} keepOnUnmount - Whether to keep the title when component unmounts (default: false)
 * @param {string} suffix - Optional suffix to append to the title (default: " - Dusk and Dawn")
 */
const useDocumentTitle = (title, keepOnUnmount = false, suffix = " - Dusk and Dawn") => {
  const prevTitleRef = useRef(document.title);
  const titleRef = useRef(title);

  useEffect(() => {
    // Store the previous title when the hook is first used
    if (titleRef.current !== title) {
      prevTitleRef.current = document.title;
      titleRef.current = title;
    }

    // Set the new title
    if (title) {
      document.title = title + suffix;
    }

    // Cleanup function to restore previous title
    return () => {
      if (!keepOnUnmount) {
        document.title = prevTitleRef.current;
      }
    };
  }, [title, keepOnUnmount, suffix]);

  // Also update when component unmounts
  useEffect(() => {
    return () => {
      if (!keepOnUnmount) {
        document.title = prevTitleRef.current;
      }
    };
  }, [keepOnUnmount]);
};

export default useDocumentTitle;
