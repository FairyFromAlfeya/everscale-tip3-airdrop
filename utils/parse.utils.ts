import { readFileSync } from 'fs';
import { Address } from 'locklift';
import { parse } from 'csv-parse';

export const parseCSV = (filePath: string): Promise<Address[]> => {
  const data = readFileSync(filePath, { encoding: 'utf-8' });

  return new Promise<Address[]>((resolve) =>
    parse(data, (_, result: string[]) =>
      resolve(result.map((a) => new Address(a[0]))),
    ),
  );
};
