import { toNano, getRandomNonce } from 'locklift';

export default async (): Promise<void> => {
  const owner = locklift.deployments.getAccount('OwnerWallet');
  const token = locklift.deployments.getContract('TokenRoot');

  await locklift.deployments.deploy({
    deployConfig: {
      contract: 'SimpleBatchTip3Transfer',
      publicKey: owner.signer.publicKey,
      initParams: { _nonce: getRandomNonce() },
      constructorParams: {
        _initialOwner: owner.account.address,
        _initialTokenRoot: token.address,
      },
      value: toNano(2),
    },
    deploymentName: 'Tip3BatchTransfer',
    enableLogs: true,
  });
};

export const tag = 'tip3-batch-transfer';

export const dependencies = ['owner-wallet', 'token-root'];
