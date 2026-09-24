export const formatPublicRequestLog = ({
  method,
  path,
  statusCode,
  durationMs,
}) => (
  `[LOG] ${method} ${path} | ${statusCode} | ${Math.round(durationMs)}ms`
)
