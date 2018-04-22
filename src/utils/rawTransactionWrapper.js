import Lisk from 'lisk-js';
import Fees from '../constants/fees';
import transactionTypes from '../constants/transactionTypes';

export const createRawSendTX = (senderPublicKey, recipientId, amount) => {
  const now = new Date().getTime();
  const transaction = {
    type: transactionTypes.send,
    amount,
    fee: Fees.send,
    senderPublicKey,
    recipientId,
    timestamp: Lisk.slots.getTime(now),
    asset: {},
  };
  return transaction;
};

export const createDelegateTX = (senderPublicKey, username) => {
  const now = new Date().getTime();
  const transaction = {
    type: transactionTypes.registerDelegate,
    amount: 0,
    fee: Fees.registerDelegate,
    senderPublicKey,
    recipientId: null,
    timestamp: Lisk.slots.getTime(now),
    asset: {
      delegate: {
        username,
        publicKey: senderPublicKey,
      },
    },
  };
  return transaction;
};

export const concatVoteLists = (voteList, unvoteList) => voteList.map(delegate => `+${delegate}`).concat(unvoteList.map(delegate => `-${delegate}`));

export const createRawVoteTX = (senderPublicKey, recipientId, votedList, unvotedList) => {
  const now = new Date().getTime();
  const transaction = {
    type: transactionTypes.vote,
    amount: 0,
    fee: Fees.vote,
    senderPublicKey,
    recipientId,
    timestamp: Lisk.slots.getTime(now),
    asset: { votes: concatVoteLists(votedList, unvotedList) },
  };
  return transaction;
};

export const getTransactionBytes = transaction => Lisk.crypto.getBytes(transaction);

export const getBufferToHex = buffer => Lisk.crypto.bufferToHex(buffer);

export const calculateTxId = transaction => Lisk.crypto.getId(transaction);

