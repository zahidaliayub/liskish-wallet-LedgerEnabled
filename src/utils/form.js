import loginTypes from '../constants/loginTypes';

export const authStatePrefill = account => ({
  secondPassphrase: {
    value: null,
  },
  passphrase: {
    value: (account && account.passphrase) || '',
  },
});

export const authStateIsValid = function (state, account) {
  return (!state.passphrase.error &&
    state.passphrase.value !== '' &&
    !state.secondPassphrase.error &&
    state.secondPassphrase.value !== '') || account.loginType !== loginTypes.passphrase;
};

export const handleChange = function (name, value, error) {
  this.setState({
    [name]: {
      value,
      error: typeof error === 'string' ? error : undefined,
    },
  });
};
