var sinon = require('sinon');

const playback = require('../src/modules/media-playback');
const CONSTANTS = require('../src/utils/constants');

const sandbox = sinon.createSandbox();

describe('media-playback module', () => {
    var replySpy,
        message;

    beforeEach(() => {
        replySpy = sinon.spy();
        message = {member: {voiceChannel: null}, reply: replySpy};
    });

    describe('when bot is playing music in message sender\'s voice channel', () => {
        var pauseSpy,
            resumeSpy,
            endSpy;

        beforeEach(() => {
            pauseSpy = sinon.spy();
            resumeSpy = sinon.spy();
            endSpy = sinon.spy();

            const dispatcher = {pause: pauseSpy, resume: resumeSpy, end: endSpy};
            message.member.voiceChannel = {connection: {dispatcher: dispatcher}};
        });

        afterEach(() => {
            sinon.assert.notCalled(replySpy);
        });

        it('pause is successful', () => {
            playback.pause(message);

            sinon.assert.calledOnce(pauseSpy);
            sinon.assert.notCalled(resumeSpy);
            sinon.assert.notCalled(endSpy);
        });

        it('resume is successful', () => {
            playback.resume(message);

            sinon.assert.calledOnce(resumeSpy);
            sinon.assert.notCalled(pauseSpy);
            sinon.assert.notCalled(endSpy);
        });

        it('stop is successful', () => {
            playback.stop(message);
            
            sinon.assert.calledOnce(endSpy);
            sinon.assert.notCalled(pauseSpy);
            sinon.assert.notCalled(resumeSpy);
        });
    });

    describe('when message sender is not in a voice channel', () => {

        afterEach(() => {
            sinon.assert.calledOnce(replySpy);
            sinon.assert.calledWith(replySpy, CONSTANTS.BOT_MESSAGES.NO_VOICE_CHANNEL);
        });

        it('pause fails, responds to message sender with error', () => {
            playback.pause(message);
        });

        it('resume fails, responds to message sender with error', () => {
            playback.resume(message);
        });

        it('stop fails, responds to message sender with error', () => {
            playback.stop(message);
        });
    });

    describe('when the bot is not connected to the message sender\'s voice channel', () => {

        beforeEach(() => {
            message.member.voiceChannel = {connection: null};
        });

        afterEach(() => {
            sinon.assert.calledOnce(replySpy);
            sinon.assert.calledWith(replySpy, CONSTANTS.BOT_MESSAGES.NO_VOICE_CONNECTION);
        });

        it('pause fails, responds to message sender with error', () => {
            playback.pause(message);
        });

        it('resume fails, responds to message sender with error', () => {
            playback.resume(message);
        });

        it('stop fails, responds to message sender with error', () => {
            playback.stop(message);
        });
    });

    describe('when the bot is not playing music in the message sender\'s voice channel', () => {
        
        beforeEach(() => {
            message.member.voiceChannel = {connection: {dispatcher: null}};
        });

        afterEach(() => {
            sinon.assert.calledOnce(replySpy);
            sinon.assert.calledWith(replySpy, CONSTANTS.BOT_MESSAGES.NO_VOICE_CONNECTION);
        });

        it('pause fails, responds to message sender with error', () => {
            playback.pause(message);
        });

        it('resume fails, responds to message sender with error', () => {
            playback.resume(message);
        });

        it('stop fails, responds to message sender with error', () => {
            playback.stop(message);
        });
    });
});