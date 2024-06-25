import { Contract, Address, toNano } from 'locklift';
import { expect } from 'chai';
import { BigNumber } from 'bignumber.js';

import { chunkify } from '../utils/chunk.utils';
import { parseCSV } from '../utils/parse.utils';

import {
  SimpleBatchTip3TransferAbi,
  TokenWalletUpgradeableAbi,
} from '../build/factorySource';

describe('Tip3BatchTransfer', () => {
  let owner: Address;
  let tokenWallet: Contract<TokenWalletUpgradeableAbi>;
  let batch: Contract<SimpleBatchTip3TransferAbi>;

  before('deploy contracts', async () => {
    await locklift.deployments.fixture();

    owner = locklift.deployments.getAccount('OwnerWallet').account.address;
    tokenWallet =
      locklift.deployments.getContract<TokenWalletUpgradeableAbi>(
        'TokenWallet',
      );
    batch =
      locklift.deployments.getContract<SimpleBatchTip3TransferAbi>(
        'Tip3BatchTransfer',
      );
  });

  describe('prepare tip3 batch transfer', () => {
    it('should transfer 50_000_000_000 tokens to batch transfer', async () => {
      const batchWallet = await batch.methods
        .tokenWallet()
        .call()
        .then((r) => r.tokenWallet);

      const { traceTree } = await locklift.tracing.trace(
        tokenWallet.methods
          .transferToWallet({
            amount: new BigNumber(50).shiftedBy(18).toString(),
            recipientTokenWallet: batchWallet,
            remainingGasTo: owner,
            notify: false,
            payload: '',
          })
          .send({ from: owner, amount: toNano(3) }),
      );

      return expect(traceTree)
        .to.call('acceptTransfer', batchWallet)
        .count(1)
        .withNamedArgs({
          amount: new BigNumber(50).shiftedBy(18).toString(),
          sender: owner,
          remainingGasTo: owner,
          notify: false,
        });
    });
  });

  describe('send airdrop to all users', () => {
    it('should send 1535909.565644774 tokens to each user', async function () {
      this.timeout(0);

      const addresses = await parseCSV('assets/addresses.csv');

      const CHUNK_SIZE = 500;

      for (const recipients of chunkify(addresses, CHUNK_SIZE)) {
        console.log(
          `Sending: ${recipients[0].recipient} - ${
            recipients[recipients.length - 1].recipient
          }`,
        );

        const { traceTree } = await locklift.tracing.trace(
          batch.methods
            .batchTransfer({
              _requests: recipients,
              _offset: 0,
              _remainingGasTo: owner,
            })
            .send({
              from: owner,
              amount: toNano('500'),
            }),
        );

        expect(traceTree).to.call('acceptTransfer').count(recipients.length);
      }
    });
  });
});
