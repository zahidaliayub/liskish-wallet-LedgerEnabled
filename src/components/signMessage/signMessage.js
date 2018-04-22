import React from 'react';
import Input from 'react-toolbox/lib/input';
import Lisk from 'lisk-js';
import { DposLedger } from 'dpos-ledger-api';
import InfoParagraph from '../infoParagraph';
import SignVerifyResult from '../signVerifyResult';
import AuthInputs from '../authInputs';
import ActionBar from '../actionBar';
import { authStatePrefill, authStateIsValid } from '../../utils/form';
import loginTypes from '../../constants/loginTypes';
import { getLedgerAccount, getLedgerTransportMethod } from '../../utils/ledger';
import { getBufferToHex } from '../../utils/rawTransactionWrapper';

class SignMessageComponent extends React.Component {
  constructor() {
    super();
    this.state = {
      message: { value: '' },
      result: '',
      ...authStatePrefill(),
    };
  }

  componentDidMount() {
    this.setState({
      ...authStatePrefill(this.props.account),
    });
  }

  handleChange(name, value, error) {
    this.setState({
      [name]: {
        value,
        error,
      },
      result: undefined,
    });
  }

  sign(message) {
    switch (this.props.account.loginType) {
      // eslint-disable-next-line no-case-declarations
      case loginTypes.passphrase:
        const signedMessage = Lisk.crypto.signMessageWithSecret(message,
          this.state.passphrase.value);
        this.showResult(message, signedMessage);
        break;

      // eslint-disable-next-line no-case-declarations
      case loginTypes.ledgerNano:

        const transportMethod = getLedgerTransportMethod();
        const ledgerAccount = getLedgerAccount();
        let liskLedger;

        transportMethod.create()
          .then((transport) => {
            liskLedger = new DposLedger(transport);
          })
          .then(() => {
            this.props.infoToast({ label: this.props.t('Look at your Ledger for confirmation') });
            liskLedger.signMSG(ledgerAccount, message)
              .then((signature) => {
                this.showResult(message, getBufferToHex(signature));
              })
              .catch(() => {
                this.props.errorToast({ label: this.props.t('Action Denied by User.') });
              });
          });
        break;

      case loginTypes.trezor:
        this.props.infoToast({ label: this.props.t('Trezor not yet supported.') });
        break;
      default:
        this.props.errorToast({ label: this.props.t('Login Type not recognized.') });
        break;
    }
  }

  showResult(message, signedMessage) {
    const result = Lisk.crypto.printSignedMessage(
      message, signedMessage, this.props.account.publicKey);
    this.setState({ result });
    const copied = this.props.copyToClipboard(result, {
      message: this.props.t('Press #{key} to copy'),
    });
    if (copied) {
      this.props.successToast({ label: this.props.t('Result copied to clipboard') });
    }
  }

  executeSign(event) {
    event.preventDefault();
    this.sign(this.state.message.value);
  }

  render() {
    return (
      <div className='sign-message'>
        <InfoParagraph>
          {this.props.t('Signing a message with this tool indicates ownership of a privateKey (secret) and provides a level of proof that you are the owner of the key. Its important to bear in mind that this is not a 100% proof as computer systems can be compromised, but is still an effective tool for proving ownership of a particular publicKey/address pair.')}
          <br />
          {this.props.t('Note: Digital Signatures and signed messages are not encrypted!')}
        </InfoParagraph>
        <form onSubmit={this.executeSign.bind(this)} id='signMessageForm'>
          <section>
            <Input className='message' multiline label={this.props.t('Message')}
              autoFocus={true}
              value={this.state.message.value}
              onChange={this.handleChange.bind(this, 'message')} />
            <AuthInputs
              passphrase={this.state.passphrase}
              secondPassphrase={this.state.secondPassphrase}
              onChange={this.handleChange.bind(this)} />
          </section>
          {this.state.result ?
            <SignVerifyResult result={this.state.result} title={this.props.t('Result')} /> :
            <ActionBar
              secondaryButton={{
                onClick: this.props.closeDialog,
              }}
              primaryButton={{
                label: this.props.t('Sign and copy result to clipboard'),
                className: 'sign-button',
                type: 'submit',
                disabled: (!this.state.message.value ||
                  this.state.result ||
                  !authStateIsValid(this.state, this.props.account)),
              }} />
          }
        </form>
      </div>
    );
  }
}

export default SignMessageComponent;
