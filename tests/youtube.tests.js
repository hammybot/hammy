var sinon = require('sinon');
var rewire = require("rewire");
var Q = require('q');

const youtube = rewire('../src/modules/youtube');
const CONSTANTS = require('../src/utils/constants');

const sandbox = sinon.createSandbox();

describe('youtube module', () => {
    var message;
    let mockResponse = { items: [{ snippet: { title: "Song 1" } }, { snippet: { title: "Song 2" } }] };

    beforeEach(() => {
        youtube.__set__('createYoutubeStream', (url, options) => {
            return { fake: 'stream' };
        });

        message = { content: '', member: { voiceChannel: null }, guild: {} };
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
                const playStreamSpy = sinon.spy(stream => { return { on: () => { } } });
                const connection = { playStream: playStreamSpy }

                const joinDeferred = Q.defer();
                joinDeferred.resolve(connection);

                message.member.voiceChannel = { join: () => { return joinDeferred.promise } };

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
                message.member.voiceChannel = { connection: {} };
                youtube.playYoutube(message);

                sinon.assert.calledOnce(replySpy);
                sinon.assert.calledWith(replySpy, CONSTANTS.BOT_MESSAGES.ALREADY_PLAYING);
            });
        });
    });
    describe('when search youtube is called', () => {
        var replySpy;
        var youtubeClientSpy;

        class youtubeMock {
            constructor() {
                return youtubeClientSpy
            }
        }

        beforeEach(() => {
            message.content = '!search funky music';
            replySpy = sinon.spy();
            message.reply = replySpy;
            youtubeClientSpy = {
                setKey: sinon.spy(),
                search: (term, length, callback) => callback(null, mockResponse)
            };

            youtube.__set__('Youtube', youtubeMock)
        });

        describe('with valid data', () => {
            it('conducts the seach', () => {
                youtube.searchYoutube(message);
                sinon.assert.calledOnce(youtubeClientSpy.setKey)
                sinon.assert.calledOnce(replySpy);
                sinon.assert.calledWith(replySpy, '**Here are the top 5 results for your search "funky music":**\r**1)** Song 1,\r**2)** Song 2');
            });
        });

        describe('with invalid data',() =>{
            it('doesnt have a message guild', () =>{
                message.guild = null;
                youtube.searchYoutube(message);
                sinon.assert.notCalled(youtubeClientSpy.setKey)
                sinon.assert.notCalled(replySpy);
            });
            
            it('replies with error message when error',() =>{
                youtubeClientSpy.search =  (term, length, callback) => callback({}, null);
                youtube.searchYoutube(message);
                sinon.assert.calledOnce(replySpy);
                sinon.assert.calledWith(replySpy, CONSTANTS.BOT_MESSAGES.ERROR_OCCURED);
            });

            it('doesnt have the search term', () => {
                message.content ='!serch funy music';
                youtube.searchYoutube(message);
                sinon.assert.notCalled(youtubeClientSpy.setKey)
                sinon.assert.notCalled(replySpy);
            })
        });
    });
});