"use strict";
const sha256 = require('../sha256');
const colors = require('colors')

function testSha256(){
  var messagesToTest = {
    "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq": "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1" ,
    "abc" : "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu": "cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1",
  }
  //sha256.gpuSHA256("abc");
  for (var testMessage in messagesToTest){
    var shaResult = sha256.gpuSHA256(testMessage).toString('hex');
    if (shaResult === messagesToTest[testMessage]){
      console.log(`Sha256 of ${testMessage} successfully computed to be: ${shaResult}`.green);
    } else {
      throw (`Sha256 of ${testMessage} computes to: ${shaResult} which is not correct.`);
    }
  }
}

module.exports = {
  testSha256
}