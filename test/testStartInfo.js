/**
 * test startinfo validity
 */
let secp = require('secp256k1');
let test = require('tape');
let { sha256, addressHash } = require('../common.js');
let { complexSendTx, sendTx, signTx, getState } = require('./testCommon.js');

let privAlice = Buffer.from("ebca1fcfba3e09e865613a87a3814813ab932936885c1b0495f1c05c7e21b1fc", "hex"); // alice's private key
let pubAlice = secp.publicKeyCreate(privAlice); // create public key
let addrAlice = addressHash(pubAlice);

let marketId = "m" + new Date().getTime();

async function main() {

  let tx = {
    "type": "start",
    "marketId": marketId,
    "startInfo": {
      "question": "Who will win FIFA 2018?",
      "outcomes": [
        "england",
        "italy",
        "brazil",
        "germany"
      ],
      "oracle": ["9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL","5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj"], // addresses of approved oracles
      // meta data about oracle.  eg. description
      "oracleMeta": "http://data.com/oracleinfo",
      "phaseTime":{
        "marketStart":9,"marketEnd":3609,
        "oracleStart":3610,"oracleEnd":7210,
        "challengeStart":7211,"challengeEnd":10811,
        "voteStart":10812,"voteEnd":14412,
        "distributeStart":14413,"distributeEnd":18013
      },
    },
  };

  //
  // test 1: no question
  //
  let cloned = Object.assign({}, tx);
  delete cloned.startInfo.question;
  let result = await complexSendTx(cloned, privAlice);
  console.log("no question.  result: ", result);
  console.log("result.result.height should be 0: ", result.result.height);
  // result.result.check_tx.log should state why it is rejected
  
  //
  // test 2: no outcomes
  //
  cloned = Object.assign({}, tx);
  delete cloned.startInfo.outcomes;
  result = await complexSendTx(cloned, privAlice);
  console.log("no outcomes.  result: ", result);
  console.log("result.result.height should be 0: ", result.result.height);
  // result.result.check_tx.log should state why it is rejected

  //
  // test 3: no oracle
  //
  cloned = Object.assign({}, tx);
  delete cloned.startInfo.oracle;
  result = await complexSendTx(cloned, privAlice);
  console.log("no oracle.  result: ", result);
  console.log("result.result.height should be 0: ", result.result.height);
  // result.result.check_tx.log should state why it is rejected

  //
  // test 4: oracle is not an array
  //
  cloned = Object.assign({}, tx);
  cloned.startInfo.oracle = {"whatever": "whatever"};
  result = await complexSendTx(cloned, privAlice);
  console.log(".  result: ", result);
  console.log("result.result.height should be 0: ", result.result.height);
  // result.result.check_tx.log should state why it is rejected

  state = await getState();
  console.log("state: ", state);
  // note: cannot use await inside tape test function.
  // also, when there is async function, we cannot declare test twice with tape.
  // we will get "Error: test exited without ending" if we declare tape test twice 
  // with the async function.
  // https://github.com/substack/tape/issues/160
  test("test invalid startInfo: ", function(t) {
    // market should not be created.  
    t.equal(typeof(state.market[marketId]), 'undefined');
    t.end();
  });
}
main();

