/**
 * paginate(query, options)
 * ─────────────────────────────────────────────────────────────
 * Shared pagination helper used by all list endpoints.
 * Executes the data query and a count query in parallel and
 * returns a consistent shape for every paginated response.
 *
 * @param {import('mongoose').Query} dataQuery  — the find() query (no .exec() yet)
 * @param {import('mongoose').Query} countQuery — the countDocuments() query
 * @param {{ page, limit }}          opts
 * @returns {{ data, pagination }}
 */
export async function paginate(dataQuery, countQuery, { page, limit }) {
  const pageNum  = Math.max(1, Number(page)  || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip     = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    dataQuery.skip(skip).limit(limitNum),
    countQuery,
  ]);

  return {
    data,
    pagination: {
      total,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext:    pageNum < Math.ceil(total / limitNum),
      hasPrev:    pageNum > 1,
    },
  };
}
