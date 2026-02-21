export type SqlQuery = {
  text: string;
  values: unknown[];
};

export const sql = (strings: TemplateStringsArray, ...values: unknown[]): SqlQuery => {
  let text = '';
  const params: unknown[] = [];

  strings.forEach((segment, index) => {
    text += segment;
    if (index < values.length) {
      params.push(values[index]);
      text += `$${params.length}`;
    }
  });

  return { text, values: params };
};

export const joinSql = (fragments: SqlQuery[], separator = ', '): SqlQuery => {
  if (fragments.length === 0) {
    return { text: '', values: [] };
  }

  const combined: SqlQuery = { text: '', values: [] };

  fragments.forEach((fragment, index) => {
    if (index > 0) {
      combined.text += separator;
    }

    const offset = combined.values.length;
    combined.text += fragment.text.replace(/\$(\d+)/g, (_, number) => {
      const parsed = Number(number);
      if (!Number.isFinite(parsed) || parsed < 1) {
        return `$${number}`;
      }
      return `$${parsed + offset}`;
    });

    combined.values.push(...fragment.values);
  });

  return combined;
};
