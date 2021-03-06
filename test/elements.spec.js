var path = require('path');
var express = require('express');
var JWebDriver = require('../');
var expect  = require("expect.js");
require('mocha-generators').install();

var isWin32 = process.platform === 'win32';
var phantomjs = process.env['phantomjs'] || !isWin32;

var driverPort = 4444;
if(phantomjs){
    driverPort = 4445;
    runBrowserTest('phantomjs');
}
else{
    runBrowserTest('chrome');
    // runBrowserTest('firefox');
    // runBrowserTest('ie');
}

function runBrowserTest(browserName){

    describe('Element - ' + browserName+' : ', function(){

        var browser, server;
        var testPath = 'http://127.0.0.1';

        before(function*(){

            yield new Promise(function(resolve){
                //init http server
                var app = express();
                app.use(express.static(__dirname + '/public'));
                server = app.listen(5555, function(){
                    testPath += ':' + server.address().port+'/elements/';
                    resolve();
                });
            }).then(function(){
                var driver = new JWebDriver({
                    port: driverPort,
                    logLevel: 0,
                    speed: 0
                });
                return driver.sessions().then(function(arrSessions){
                    var arrPromise = arrSessions.map(function(session){
                        return session.close();
                    });
                    return Promise.all(arrPromise);
                }).session({
                    browserName: browserName
                }, function(error, ret){
                    browser = ret;
                });
            });

        });

        it('should find sub element', function*(){

            yield browser.url(testPath + 'test1.html');
            var formdiv = yield browser.find('#formdiv');
            expect(formdiv.length).to.be(1);
            var kw = yield formdiv.find('#kw');
            expect(kw.length).to.be(1);

        });

        it('should get tagName', function*(){

            var kw = yield browser.find('#kw');
            expect(yield kw.tagName()).to.be('input');

        });

        it('should get attr', function*(){

            var kw = yield browser.find('#kw');
            // read
            var test = yield kw.attr('data-test');
            expect(test).to.be('attrok');

        });

        it('should get css', function*(){

            var form = yield browser.find('#form');
            // read
            var test = yield form.css('border-width');
            expect(test).to.be('5px');

        });

        it('should get or set value', function*(){

            var kw = yield browser.find('#kw');
            var value = yield kw.val('testval123').val();
            expect(value).to.be('testval123');

        });

        it('should clear value', function*(){

            var kw = yield browser.find('#kw');
            yield kw.val('test872');
            var value = yield kw.clear().attr('value');
            expect(value).to.be('');

        });

        it('should get text', function*(){

            var pp = yield browser.find('#pp');
            var value = yield pp.text();
            expect(value).to.be('abc');

        });

        it('should get displayed', function*(){

            var pp = yield browser.find('#pp');
            expect(yield pp.displayed()).to.be(true);
            var hidediv1 = yield browser.find('#hidediv1');
            expect(yield hidediv1.displayed()).to.be(false);
            var hidediv2 = yield browser.find('#hidediv2');
            expect(yield hidediv2.displayed()).to.be(false);

        });

        it('should get offset', function*(){

            var pp = yield browser.find('#pp');
            var offset = yield pp.offset();
            expect(offset.x).to.be(101);
            expect(offset.y).to.be(102);

        });

        it('should get size', function*(){

            var pp = yield browser.find('#pp');
            var size = yield pp.size();
            expect(size.width).to.be(51);
            expect(size.height).to.be(52);

        });

        it('should get enabled', function*(){

            var submit = yield browser.find('#submit');
            expect(yield submit.enabled()).to.be(true);
            var reset = yield browser.find('#reset');
            expect(yield reset.enabled()).to.be(false);

        });

        it('should get selected', function*(){

            var check1 = yield browser.find('#check1');
            expect(yield check1.selected()).to.be(true);
            var check2 = yield browser.find('#check2');
            expect(yield check2.selected()).to.be(false);

        });


        it('should select option', function*(){

            var selecttest = yield browser.find('#selecttest');
            // index test
            yield selecttest.select(0);
            expect(yield selecttest.attr('value')).to.be('v1');
            yield selecttest.select(1);
            expect(yield selecttest.attr('value')).to.be('v2');
            yield selecttest.select(2);
            expect(yield selecttest.attr('value')).to.be('v3');
            // value test
            yield selecttest.select('v2');
            expect(yield selecttest.attr('value')).to.be('v2');
            yield selecttest.select('v4');
            expect(yield selecttest.attr('value')).to.be('v4');
            // text test
            yield selecttest.select({
                type: 'text',
                value: 'test1'
            });
            expect(yield selecttest.attr('value')).to.be('v1');
            yield selecttest.select({
                type: 'text',
                value: 'test3'
            });
            expect(yield selecttest.attr('value')).to.be('v3');

        });

        it('should click the element', function*(){

            var kw = yield browser.find('#kw');
            yield kw.click().sleep(300);
            var value = yield kw.attr('value');
            expect(value).to.be('onclick');

        });

        it('should double click the element', function*(){

            var kw = yield browser.find('#kw');
            yield kw.dblClick().sleep(300);
            var value = yield kw.attr('value');
            expect(value).to.be('ondblclick');

        });

        it('should sendkeys to the element', function*(){

            var kw = yield browser.find('#kw');
            yield kw.clear().sendKeys('a{SHIFT}aaa{SHIFT}a').sleep(300);
            var value = yield kw.attr('value');
            expect(value).to.be('aAAAa');

        });

        it('should sendkeys to the file element', function*(){

            var hostsPath = isWin32 ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';
            var file = yield browser.find('#file');
            yield file.sendKeys(hostsPath);
            var value = yield file.attr('value');
            expect(value).to.contain('hosts');

        });

        it('should test equals from 2 elements', function*(){

            var file = yield browser.find('#file');
            var isEqual = yield file.equal('input[type=file]');
            expect(isEqual).to.be(true);

        });

        it('should submit the form', function*(){

            var form = yield browser.find('#form');
            yield form.submit();
            expect(yield browser.url()).to.contain('test2.html');

        });

        it('should dragdrop element', function*(){

            yield browser.url(testPath+'dragdrop.html');
            var draggable = yield browser.find('#draggable');
            var offset = yield draggable.offset();
            expect(offset.x).to.be(8);
            expect(offset.y).to.be(8);
            yield draggable.dragDropTo('body', 501, 502);
            offset = yield draggable.offset();
            expect(offset.x).to.greaterThan(400);
            expect(offset.y).to.greaterThan(400);

        });

        it('should uploadFile to file element', function*(){

            if(browser.browserName !== 'phantomjs'){
                yield browser.url(testPath + 'test1.html');
                var file = yield browser.find('#file');
                yield file.uploadFile(path.resolve(__dirname, 'resource/upload.jpg'));
                var value = yield file.attr('value');
                expect(value).to.contain('upload.jpg');
            }

        });

        after(function*(){
            server.close();
            yield browser.close();
        });
    });

}
