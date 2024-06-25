import { toNano } from 'locklift';

import { parseCSV } from '../utils/parse.utils';
import { chunkify } from '../utils/chunk.utils';

import { SimpleBatchTip3TransferAbi } from '../build/factorySource';

const main = async (): Promise<void> => {
  const owner = locklift.deployments.getAccount('OwnerWallet').account.address;
  const batch =
    locklift.deployments.getContract<SimpleBatchTip3TransferAbi>(
      'Tip3BatchTransfer',
    );

  const addresses = await parseCSV('assets/addresses.csv');

  const CHUNK_SIZE = 500;

  for (const recipients of chunkify(addresses, CHUNK_SIZE)) {
    console.log(
      `Sending: ${recipients[0].recipient} - ${
        recipients[recipients.length - 1].recipient
      }`,
    );

    await locklift.transactions.waitFinalized(
      batch.methods
        .batchTransfer({
          _requests: recipients,
          _offset: 0,
          _remainingGasTo: owner,
        })
        .send({
          from: owner,
          amount: toNano('500'),
          bounce: true,
        }),
    );
  }
};

main()
  .then(() => console.log('Success'))
  .catch((e) => console.error(e));
