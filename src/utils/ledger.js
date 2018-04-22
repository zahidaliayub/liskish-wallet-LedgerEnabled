import { isBrowser, isNode } from 'browser-or-node';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { LedgerAccount, SupportedCoin } from 'dpos-ledger-api';
import isElectron from 'is-electron';

const getLedgerTransportMethod = () => {
  let transportMethod;
  if (isNode || isElectron()) {
    transportMethod = TransportNodeHid;
  } else if (isBrowser) {
    transportMethod = TransportU2F;
  } else {
    return null;
  }
  return transportMethod;
};

const getLedgerAccount = (accountIndex = 0) => {
  const ledgerAccount = new LedgerAccount();
  ledgerAccount.coinIndex(SupportedCoin.LISK);
  ledgerAccount.account(accountIndex);
  return ledgerAccount;
};

export { getLedgerTransportMethod, getLedgerAccount };
