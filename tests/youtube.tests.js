var sinon = require('sinon');
var rewire = require("rewire");
var Q = require('q');

const youtube = rewire('../src/modules/youtube');
const CONSTANTS = require('../src/utils/constants');

const sandbox = sinon.createSandbox();

describe('youtube module', () => {
    var message;

    beforeEach(() => {
        youtube.__set__('createYoutubeStream', (url, options) => {
            return {fake: 'stream'};
        });

        message = {content: '', member: {voiceChannel: null}, guild: {}};
    });

    describe('when play youtube is called', () => {
        var replySpy;

        beforeEach(() => {
            message.content = '!play https://www.youtube.com/watch?v=UBQP9gEldRk';
            replySpy = sinon.spy();
            message.reply = replySpy;
        });
        
        describe('with valid data', () => {
            it('starts playback with youtube stream', () => {
                const playStreamSpy = sinon.spy(stream => {return {on: () => {}}});
                const connection = {playStream: playStreamSpy}

                const joinDeferred = Q.defer();
                joinDeferred.resolve(connection);

                message.member.voiceChannel = {join: () => {return joinDeferred.promise}};

                youtube.playYoutube(message);

                setTimeout(() => {
                    sinon.assert.calledOnce(playStreamSpy)
                }, 100);
            });
        });
        
        describe('with invalid data', () => {
            it('no voice channel, replys with error', () => {
                youtube.playYoutube(message);

                sinon.assert.calledOnce(replySpy);
                sinon.assert.calledWith(replySpy, CONSTANTS.BOT_MESSAGES.NO_VOICE_CHANNEL);
            });
    
            it('already connected to voice channel, replys with error', () => {
                message.member.voiceChannel = {connection: {}};
                youtube.playYoutube(message);

                sinon.assert.calledOnce(replySpy);
                sinon.assert.calledWith(replySpy, CONSTANTS.BOT_MESSAGES.ALREADY_PLAYING);
            });
        });
    });
});