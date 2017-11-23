import React from 'react';
import Input from 'react-toolbox/lib/input';
import Lisk from 'lisk-js';
import { translate } from 'react-i18next';
import SignVerifyResult from '../signVerifyResult';
import ActionBar from '../actionBar';


class EncryptMessage extends React.Component {
  constructor() {
    super();
    this.state = {
      result: '',
      recipientPublicKey: {
        value: '',
      },
      message: {
        value: '',
      },
    };
  }

  handleChange(name, value, error) {
    this.setState({
      [name]: {
        value,
        error,
      },
      result: null,
    });
  }

  encrypt(event) {
    event.preventDefault();
    let cryptoResult = null;
    try {
      cryptoResult = Lisk.crypto.encryptMessageWithSecret(
        this.state.message.value,
        this.props.account.passphrase,
        this.state.recipientPublicKey.value);
    } catch (error) {
      this.props.errorToast({ label: error.message });
    }
    if (cryptoResult) {
      const result = [
        '-----BEGIN LISK ENCRYPTED MESSAGE-----',
        '-----SENDER PUBLIC KEY-----',
        this.props.account.publicKey,
        '-----ENCRYPTED MESSAGE-----',
        cryptoResult.encryptedMessage,
        '-----NONCE-----',
        cryptoResult.nonce,
        '-----END LISK ENCRYPTED MESSAGE-----',
      ].join('\n');
      this.setState({ result });
      this.showResult();
    }
  }

  showResult() {
    const copied = this.props.copyToClipboard(this.state.result, {
      message: this.props.t('Press #{key} to copy'),
    });
    if (copied) {
      this.props.successToast({ label: this.props.t('Result copied to clipboard') });
    }
  }

  render() {
    return (
      <div className='sign-message'>
        <form onSubmit={this.encrypt.bind(this)}>
          <section>
            <Input className='recipientPublicKey' label={this.props.t('Recipient PublicKey')}
              autoFocus={true}
              value={this.state.recipientPublicKey.value}
              onChange={this.handleChange.bind(this, 'recipientPublicKey')} />
            <Input className='message' multiline label={this.props.t('Message')}
              autoFocus={true}
              value={this.state.message.value}
              onChange={this.handleChange.bind(this, 'message')} />
          </section>
          {this.state.result ?
            <SignVerifyResult id='encryptResult' result={this.state.result} title={this.props.t('Result')} /> :
            <ActionBar
              secondaryButton={{
                onClick: this.props.closeDialog,
              }}
              primaryButton={{
                label: this.props.t('encrypt'),
                className: 'sign-button',
                type: 'submit',
                disabled: (this.state.message.value.length === 0 ||
                  this.state.recipientPublicKey.value.length === 0),
              }} />
          }
        </form>
      </div>
    );
  }
}

export default translate()(EncryptMessage);
