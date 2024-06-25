import { readFileSync } from 'fs';
import { Address } from 'locklift';
import { parse } from 'csv-parse';
import { BigNumber } from 'bignumber.js';

type Request = {
  recipient: Address;
  amount: string;
};

export const parseCSV = (filePath: string): Promise<Request[]> => {
  const data = readFileSync(filePath, { encoding: 'utf-8' });

  return new Promise<Request[]>((resolve) =>
    parse(data, (_, result: string[]) =>
      resolve(
        result.map((a) => ({
          recipient: new Address(a[0]),
          amount: new BigNumber(a[2]).shiftedBy(9).toString(),
        })),
      ),
    ),
  );
};
