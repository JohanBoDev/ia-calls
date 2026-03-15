import { useState } from 'react'

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  return {
    page,
    limit,
    setPage,
    goNext: () => setPage((p) => p + 1),
    goPrev: () => setPage((p) => Math.max(1, p - 1)),
  }
}
