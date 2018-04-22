import i18next from 'i18next';
import { DposLedger } from 'dpos-ledger-api';
import actionTypes from '../constants/actions';
import { setSecondPassphrase, send, broadcastTransaction } from '../utils/api/account';
import { registerDelegate } from '../utils/api/delegate';
import { transactionAdded } from './transactions';
import { errorAlertDialogDisplayed } from './dialog';
import Fees from '../constants/fees';
import { toRawLsk } from '../utils/lsk';
import {
  createRawSendTX,
  getTransactionBytes,
  createDelegateTX,
  getBufferToHex,
  calculateTxId } from '../utils/rawTransactionWrapper';
import transactionTypes from '../constants/transactionTypes';
import loginTypes from '../constants/loginTypes';
import { getLedgerAccount, getLedgerTransportMethod } from '../utils/ledger';
import { errorToastDisplayed, infoToastDisplayed } from '../actions/toaster';


/**
 * Trigger this action to update the account object
 * while already logged in
 *
 * @param {Object} data - account data
 * @returns {Object} - Action object
 */
export const accountUpdated = data => ({
  data,
  type: actionTypes.accountUpdated,
});

/**
 * Trigger this action to log out of the account
 * while already logged in
 *
 * @returns {Object} - Action object
 */
export const accountLoggedOut = () => ({
  type: actionTypes.accountLoggedOut,
});

/**
 * Trigger this action to login to an account
 * The login middleware triggers this action
 *
 * @param {Object} data - account data
 * @returns {Object} - Action object
 */
export const accountLoggedIn = data => ({
  type: actionTypes.accountLoggedIn,
  data,
});

export const passphraseUsed = data => ({
  type: actionTypes.passphraseUsed,
  data,
});

/**
 *
 */
export const secondPassphraseRegistered = ({ activePeer, secondPassphrase, account }) =>
  (dispatch) => {
    setSecondPassphrase(activePeer, secondPassphrase, account.publicKey, account.passphrase)
      .then((data) => {
        dispatch(transactionAdded({
          id: data.transactionId,
          senderPublicKey: account.publicKey,
          senderId: account.address,
          amount: 0,
          fee: Fees.setSecondPassphrase,
          type: transactionTypes.setSecondPassphrase,
        }));
      }).catch((error) => {
        const text = (error && error.message) ? error.message : i18next.t('An error occurred while registering your second passphrase. Please try again.');
        dispatch(errorAlertDialogDisplayed({ text }));
      });
    dispatch(passphraseUsed(account.passphrase));
  };

/**
 *
 */
export const delegateRegistered = ({
  activePeer, account, passphrase, username, secondPassphrase }) =>
  (dispatch) => {
    switch (account.loginType) {
      case loginTypes.passphrase:
        registerDelegate(activePeer, username, passphrase, secondPassphrase)
          .then((data) => {
            // dispatch to add to pending transaction
            dispatch(transactionAdded({
              id: data.transactionId,
              senderPublicKey: account.publicKey,
              senderId: account.address,
              username,
              amount: 0,
              fee: Fees.registerDelegate,
              type: transactionTypes.registerDelegate,
            }));
          })
          .catch((error) => {
            const text = error && error.message ? `${error.message}.` : i18next.t('An error occurred while registering as delegate.');
            const actionObj = errorAlertDialogDisplayed({ text });
            dispatch(actionObj);
          });
        dispatch(passphraseUsed(passphrase));
        break;

      // eslint-disable-next-line no-case-declarations
      case loginTypes.ledgerNano:
        const tx = createDelegateTX(account.publicKey, username);
        const txBytes = getTransactionBytes(tx);

        const transportMethod = getLedgerTransportMethod();
        const ledgerAccount = getLedgerAccount();
        let liskLedger;

        transportMethod.create()
          .then((transport) => {
            liskLedger = new DposLedger(transport);
          })
          .then(() => {
            dispatch(infoToastDisplayed({ label: i18next.t('Look at your Ledger for confirmation') }));
            liskLedger.signTX(ledgerAccount, txBytes, false)
              .then((signature) => {
                tx.signature = getBufferToHex(signature);
                tx.id = calculateTxId(tx);
                broadcastTransaction(activePeer, { transaction: tx })
                  .then((data) => {
                    dispatch(transactionAdded({
                      id: data.transactionId,
                      senderPublicKey: account.publicKey,
                      senderId: account.address,
                      username,
                      amount: 0,
                      fee: Fees.registerDelegate,
                      type: transactionTypes.registerDelegate,
                    }));
                  })
                  .catch((error) => {
                    const text = error && error.message ? `${error.message}.` : i18next.t('An error occurred while registering as delegate.');
                    dispatch(errorAlertDialogDisplayed({ text }));
                  });
                dispatch(passphraseUsed(passphrase));
              })
              .catch(() => {
                dispatch(errorToastDisplayed({ label: i18next.t('Action Denied by User') }));
              });
          });

        break;

      case loginTypes.trezor:
        dispatch(errorAlertDialogDisplayed({ text: i18next.t('Not Yet Implemented. Sorry.') }));
        break;

      default:
        dispatch(errorAlertDialogDisplayed({ text: i18next.t('Login Type not recognized.') }));
    }
  };

/**
 *
 */
export const sent = ({ activePeer, account, recipientId, amount, passphrase, secondPassphrase }) =>
  (dispatch) => {
    switch (account.loginType) {
      case loginTypes.passphrase:
        send(activePeer, recipientId, toRawLsk(amount), passphrase, secondPassphrase)
          .then((data) => {
            dispatch(transactionAdded({
              id: data.transactionId,
              senderPublicKey: account.publicKey,
              senderId: account.address,
              recipientId,
              amount: toRawLsk(amount),
              fee: Fees.send,
              type: transactionTypes.send,
            }));
          })
          .catch((error) => {
            const text = error && error.message ? `${error.message}.` : i18next.t('An error occurred while creating the transaction.');
            dispatch(errorAlertDialogDisplayed({ text }));
          });
        dispatch(passphraseUsed(passphrase));
        break;

      // eslint-disable-next-line no-case-declarations
      case loginTypes.ledgerNano:
        const tx = createRawSendTX(account.publicKey, recipientId, toRawLsk(amount));
        const txBytes = getTransactionBytes(tx);

        const transportMethod = getLedgerTransportMethod();
        const ledgerAccount = getLedgerAccount();
        let liskLedger;

        transportMethod.create()
          .then((transport) => {
            liskLedger = new DposLedger(transport);
          })
          .then(() => {
            dispatch(infoToastDisplayed({ label: i18next.t('Look at your Ledger for confirmation') }));
            liskLedger.signTX(ledgerAccount, txBytes, false)
              .then((signature) => {
                tx.signature = getBufferToHex(signature);
                tx.id = calculateTxId(tx);
                broadcastTransaction(activePeer, { transaction: tx })
                  .then((data) => {
                    dispatch(transactionAdded({
                      id: data.transactionId,
                      senderPublicKey: account.publicKey,
                      senderId: account.address,
                      recipientId,
                      amount: toRawLsk(amount),
                      fee: Fees.send,
                      type: transactionTypes.send,
                    }));
                  })
                  .catch((error) => {
                    const text = error && error.message ? `${error.message}.` : i18next.t('An error occurred while creating the transaction.');
                    dispatch(errorAlertDialogDisplayed({ text }));
                  });
                dispatch(passphraseUsed(passphrase));
              })
              .catch(() => {
                dispatch(errorToastDisplayed({ label: i18next.t('Action Denied by User') }));
              });
          });
        break;

      case loginTypes.trezor:
        dispatch(errorAlertDialogDisplayed({ text: i18next.t('Not Yet Implemented. Sorry.') }));
        break;

      default:
        dispatch(errorAlertDialogDisplayed({ text: i18next.t('Login Type not recognized.') }));
    }
  };
