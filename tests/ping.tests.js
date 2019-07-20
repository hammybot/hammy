var Q = require('q');
var sinon = require('sinon');

const ping = require('../src/modules/ping');
const CONSTANTS = require('../src/utils/constants');

const sandbox = sinon.createSandbox();

describe('ping module', () => {
	var sendSpy,
		editSpy,
		message,
		sendDeferred;

	beforeEach(() => {
		sendSpy = sinon.spy();
		editSpy = sinon.spy();
		sendDeferred = Q.defer();

		message = {
			channel: {
				send: (msg) => {
					sendSpy(msg);
					return sendDeferred.promise
				}
			}
		};
		sendDeferred.resolve({ edit: editSpy });
	});

	describe('when send ping is called', () => {
		it('responds to the message creator with a pong paddle', () => {
			ping.sendPing(message);

			sinon.assert.calledOnce(sendSpy);
			sinon.assert.calledWith(sendSpy, CONSTANTS.BOT_MESSAGES.PONG);
			setTimeout(() => {
				sinon.assert.calledOnce(editSpy);
			}, 100);
		});
	});
});
