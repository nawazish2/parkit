export const safeParseJSON = (data: any, fallback: any = []): any => {
  if (!data) return fallback;
  if (typeof data !== 'string') return data;
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === 'string') {
      // Handle double-stringification
      return JSON.parse(parsed);
    }
    return parsed;
  } catch (e) {
    return fallback;
  }
};
