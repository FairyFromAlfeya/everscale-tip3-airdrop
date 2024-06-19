import {
  toNano,
  getRandomNonce,
  zeroAddress,
  Address,
  Contract,
} from 'locklift';
import { BigNumber } from 'bignumber.js';

import { TokenRootUpgradeableAbi } from '../build/factorySource';

const DEPLOYED_TOKEN: Address | null = null;

export default async (): Promise<void> => {
  const owner = locklift.deployments.getAccount('OwnerWallet');
  let root: Contract<TokenRootUpgradeableAbi>;

  if (DEPLOYED_TOKEN) {
    await locklift.deployments.saveContract({
      deploymentName: 'TokenRoot',
      address: DEPLOYED_TOKEN,
      contractName: 'TokenRootUpgradeable',
    });

    root = locklift.factory.getDeployedContract(
      'TokenRootUpgradeable',
      DEPLOYED_TOKEN,
    );
  } else {
    const walletCode = locklift.factory.getContractArtifacts(
      'TokenWalletUpgradeable',
    ).code;
    const platformCode = locklift.factory.getContractArtifacts(
      'TokenWalletPlatform',
    ).code;

    const { contract } = await locklift.deployments.deploy({
      deployConfig: {
        contract: 'TokenRootUpgradeable',
        publicKey: owner.signer.publicKey,
        initParams: {
          randomNonce_: getRandomNonce(),
          deployer_: zeroAddress,
          name_: 'Token Root',
          symbol_: 'TKN',
          decimals_: 9,
          walletCode_: walletCode,
          rootOwner_: owner.account.address,
          platformCode_: platformCode,
        },
        constructorParams: {
          initialSupplyTo: owner.account.address,
          initialSupply: new BigNumber(10).shiftedBy(20).toString(),
          deployWalletValue: toNano(0.1),
          mintDisabled: false,
          burnByRootDisabled: true,
          burnPaused: true,
          remainingGasTo: owner.account.address,
        },
        value: toNano(10),
      },
      deploymentName: 'TokenRoot',
      enableLogs: true,
    });

    root = contract as Contract<TokenRootUpgradeableAbi>;
  }

  root.methods
    .walletOf({ answerId: 0, walletOwner: owner.account.address })
    .call()
    .then((res) =>
      locklift.deployments.saveContract({
        deploymentName: 'TokenWallet',
        address: res.value0,
        contractName: 'TokenWalletUpgradeable',
      }),
    );
};

export const tag = 'token-root';

export const dependencies = ['owner-wallet'];
