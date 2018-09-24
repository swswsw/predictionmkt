let lotion = require('lotion')
let BigNumber = require('bignumber.js'); // https://github.com/MikeMcl/bignumber.js/
let secp = require('secp256k1');
let { sha256, addressHash } = require('./common.js');
let getSigHash = require('./sigHash.js');
let stateUtil = require('./stateUtil.js');
let express = require('express');


//Peter: Express
const expressapp = express();
expressapp.set('view engine', 'pug');
expressapp.use(express.static(__dirname + '/public'));
expressapp.set('views', __dirname + '/public');
expressapp.engine('html', require('ejs').renderFile);
expressapp.set('view engine', 'html');

expressapp.get('/', (req, res) => {
  res.render('index.html');
});

expressapp.get('/login', (req, res) => {
  res.render('login.html');
});

expressapp.get('/market', (req, res) => {
  res.render('market.html');
});

expressapp.get('/profile', (req, res) => {
  res.render('profile.html');
});

expressapp.listen(3000, () => {
  //console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});


const STARTING_SEQ = 0;

// market state template.
// every market will have a state like this.
let marketTemplate = {
  id: "", // [string] market id
  phaseTime: {}, // the start and end time of each phase (time in blockheight)
  bets: [],
  oracles: [], // list of approved oracles when market is created
  oracleOutcome: -1, // for hackathon, we only have one oracle, so we makes it simple.
                    // just one single result.  outcome is specified by 1, 2, ....
                    // 0 indicate no outcome yet
  //oracleOutcomes: [], // when oracle pushes the result, it is stored here.
  challenge: undefined, // [Object] challenge object stating the challenge info
  voteRecords: [], // list of all vote
  // votes: {
  //   outcome1: 0,
  //   outcome2: 0,
  //   outcome3: 0,
  // }, // aggregated result of vote
  payoutRatio: 1.5,
  storage: {},
}


let initMarket = Object.assign({}, marketTemplate);

let initialState = {
  market: {
    market1: initMarket,
  }, // store the various market.  each market will have a market state object inside this.  
  
  balances: {
    '5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj': 10000,
    '9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL': 10000,
    't6bUAUxNh8xoZzt6YZdQn27J4DSiR2oH': 10000,
  },

  // store the current sequence of the user.
  seq: {

  }
}

/*
calculation:
in general, we try to use bignumber to do calculation.
however, we will still store the final result in state object as number.  because bignumber object does not store in state well.
*/

/*
format of start tx
{
  type: "start",
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
}

format of bets
{
type: "bet",
user: "alice", // should be an address
amount: 100, // may allow multi token later
outcome: 1, // user bets on outcome 1,2,3, or...

}

format of challenge
{
  type: "challenge",
  user: "alice", // should be an address
  amount: 100,
}

format of vote
{
  type: "vote",
  user: "alice", // should be an address
  amount: 1000,
  outcome: 1,
}

format of distribute
{type: "distribute"}
*/

let app = lotion({
  initialState: initialState,
  devMode: true
})

app.use(txVerifySigHandler);
app.use(txHandler1);
app.use(txHandler2);
app.use(txStartHandler);
app.use(txBetHandler);
app.use(txOracleHandler);
app.use(txChallengeHandler);
app.use(txVoteHandler);
app.use(txDistributeHandler);
app.use(txSendHandler);

app.listen(3000).then(function(appInfo) {
  console.log(appInfo);
})

/**
 * doesn't do anything other than verify signature.  
 * @param {*} state 
 * @param {*} tx 
 * @param {*} chainInfo 
 */
function txVerifySigHandler(state, tx, chainInfo) {
  if (tx.type === "verifySig") {
    let cloned = Object.assign({}, tx);
    console.log("verifySig tx: ", JSON.stringify(cloned));
    let verifyResult = verifySig(state, cloned);
    if (!verifyResult.verified) {
      console.log('invalid signature!');
      throw Error("invalid signature!");
    }

    console.log("signature verified!");
  }
}

function txHandler1(state, tx, chainInfo) {
  console.log("tx: ", JSON.stringify(tx));
  //console.log(chainInfo);
  checkTxCommon(tx); // this is always called, so we check it here.
}

function txHandler2(state, tx, chainInfo) {
  console.log("block height: ", chainInfo.height);
}

function txStartHandler(state, tx, chainInfo) {
  if (tx.type === "start") {
    // starting the market.
    // calculate the phase time320c2bfd1b17fdbc9dd876dd2535f562112f2cdf
    let cloned = Object.assign({}, tx);
    console.log("start: ", JSON.stringify(cloned));
    let marketId = cloned.marketId;
    let startInfo = cloned.startInfo;
  
    checkStartInfo(startInfo);

    // check marketId does not exist yet
    if (typeof (state.market[marketId]) === 'undefined') {
      // create a new market
      createNewMarket(state, marketId);

      let blockHeight = chainInfo.height;
      var t1 = 1; // ???  todo: delete
      let phaseTime = calcPhaseTime(blockHeight);
      marketSelector(state, marketId).phaseTime = phaseTime;
      console.log("phaseTime: ", marketSelector(state, marketId).phaseTime);

      // record statInfo
      marketSelector(state, marketId).startInfo = startInfo;
      // if phaseTime is provided in the startInfo, override with the one in startInfo.
      if (typeof startInfo.phaseTime !== "undefined") {
        marketSelector(state, marketId).phaseTime = startInfo.phaseTime;
      }
    } else {
      console.log("marketId " + marketId + " already exists.  new market is not created.");
    }
  }
}

function createNewMarket(state, marketId) {
  let initMarket = Object.assign({}, marketTemplate);
  initMarket.id = marketId;
  state.market[marketId] = initMarket;
}

function txBetHandler(state, tx, chainInfo) {
  if (tx.type === "bet") {
    // ignore request if it is outside of a particular phase timeframe
    if (isInPhase(chainInfo.height, "market", state)) {
      let cloned = Object.assign({}, tx);
      console.log("bet: ", JSON.stringify(cloned));

      let verifyResult = verifySig(state, cloned);
      if (!verifyResult.verified) {
        console.log('invalid signature!');
        throw Error('invalid signature!');
      }
      cleanSignature(cloned);
      
      console.log("signature verified!");
      let marketId = cloned.marketId;
      let user = cloned.user;
      let amount = new BigNumber(cloned.amount);
      // lock up their staking tokens
      state.balances[user] = new BigNumber(state.balances[user]).minus(amount).toNumber();
      marketSelector(state, marketId).bets.push(cloned);
      console.log("bets: ", marketSelector(state, marketId).bets);
    } else {
      console.log("wrong phase. bet can only be done in market phase.");
    }
  }
}

function txOracleHandler(state, tx, chainInfo) {
  if (tx.type === "oracle") {
    // ignore request if it is outside of a particular phase timeframe
    if (isInPhase(chainInfo.height, "oracle", state)) {
      console.log("should check oracle identity, but that checking is skipped for hackathon.");
      let cloned = Object.assign({}, tx);
      console.log("oracle tx: ", JSON.stringify(cloned));

      let verifyResult = verifySig(state, cloned);
      if (!verifyResult.verified) {
        console.log('invalid signature!');
        throw Error('invalid signature!');
      }
      cleanSignature(cloned);

      let marketId = cloned.marketId;

      // check if oracle is from approved oracle list.
      let approvedOracles = marketSelector(state, marketId).startInfo.oracle;
      if (!approvedOracles.includes(verifyResult.address)) {
        let msg = "only oracle from approved list can submit oracle result";
        console.log(msg);
        throw Error(msg);
      }

      marketSelector(state, marketId).oracleOutcome = cloned.outcome;
      console.log("oracleOutcome: ", marketSelector(state, marketId).oracleOutcome);
    } else {
      console.log("wrong phase. oracle call can only be done in oracle phase.");
    }
  }
}

function txChallengeHandler(state, tx, chainInfo) {
  if (tx.type === "challenge") {
    // ignore request if it is outside of a particular phase timeframe
    if (isInPhase(chainInfo.height, "challenge", state)) {
      console.log("skip challenger verification and balance verification for hackathon.");
      let cloned = Object.assign({}, tx);
      console.log("challenge tx: ", JSON.stringify(cloned));

      let verifyResult = verifySig(state, cloned);
      if (!verifyResult.verified) {
        console.log('invalid signature!');
        throw Error('invalid signature!');
      }
      cleanSignature(cloned);

      let marketId = cloned.marketId;
      let user = cloned.user;
      let amount = new BigNumber(cloned.amount);
      // lock up their staking tokens
      state.balances[user] = new BigNumber(state.balances[user]).minus(amount).toNumber();
      marketSelector(state, marketId).challenge = cloned;
      console.log("challenge: ", marketSelector(state, marketId).challenge);
    } else {
      console.log("wrong phase. challenge call can only be done in challenge phase.");
    }
  }
}

/**
 * check if challenge has been issued
 * (if the state contains challenge info)
 */
function challenged(state, marketId) {
  let obj = marketSelector(state, marketId).challenge;
  // check if challenge object is still empty
  return (typeof obj !== 'undefined');
}

function txVoteHandler(state, tx, chainInfo) {
  if (tx.type === "vote") {
    // ignore request if it is outside of a particular phase timeframe
    if (isInPhase(chainInfo.height, "vote", state)) {
      console.log("skip voter verification and balance verification for hackathon");

      let cloned = Object.assign({}, tx);
      console.log("vote tx", JSON.stringify(cloned));

      let verifyResult = verifySig(state, cloned);
      if (!verifyResult.verified) {
        console.log('invalid signature!');
        throw Error('invalid signature!');
      }
      cleanSignature(cloned);

      let marketId = cloned.marketId;
      let user = cloned.user;
      let amount = new BigNumber(cloned.amount);
      let outcome = cloned.outcome;

      if (challenged(state, marketId)) {
        // lock up their staking tokens
        state.balances[user] = new BigNumber(state.balances[user]).minus(amount).toNumber();
        marketSelector(state, marketId).voteRecords.push(cloned);
        // update votes
        //updateVotes(outcome, amount);
        console.log("vote records: ", marketSelector(state, marketId).voteRecords);
      } else {
        console.log("do not accept vote if there is no challenge");
      }

    } else {
      console.log("wrong phase. vote call can only be done in vote phase.");
    }
  }
}

function updateVotes(outcome, amount, state) {
  let outcomeName = 'outcome' + outcome;
  // if (! (outcome in marketSelector(state, marketId).votes) ) {
  //   console.log("3");
  //   marketSelector(state, marketId).votes[outcomeName] = 0;
  //   console.log("4");
  // }
  marketSelector(state, marketId).votes[outcomeName] = new BigNumber(marketSelector(state, marketId).votes[outcomeName]).plus(amount).toNumber();
}

function txDistributeHandler(state, tx, chainInfo) {
  if (tx.type === "distribute") {
    // ignore request if it is outside of a particular phase timeframe
    if (isInPhase(chainInfo.height, "distribute", state)) {
      let cloned = Object.assign({}, tx);
      console.log("distribute tx", JSON.stringify(cloned));

      let verifyResult = verifySig(state, cloned);
      if (!verifyResult.verified) {
        console.log('invalid signature!');
        throw Error('invalid signature!');
      }
      cleanSignature(cloned);

      let marketId = cloned.marketId;

      let localContractStorage = new LocalContractStorage(state, marketId);

      // check that distribute hasn't been completed already
      let checkValue = localContractStorage.getValue("payouts");
      if (typeof checkValue !== "undefined") {
        let msg = "distribute cannot be invoked again";
        console.log(msg);
        throw new Error(msg);
      }

      // do final calculation and distribute the tokens accordingly.
      
      // finaloutcome is assumed to be oracleoutcome, unless there is a vote.
      let finalOutcome = marketSelector(state, marketId).oracleOutcome;

      // if challenge is there
      if (challenged(state, marketId)) {
        // get voting pool result
        // distribute to the winner of the voter who vote for it.
        console.log("challenge was requested");

        // sum up voting pool.
        // give it to the winners proportionally.
        let voteRecords = marketSelector(state, marketId).voteRecords;

        let votePoolTotal = new BigNumber(0);
        let result = {};

        for (let i = 0; i < voteRecords.length; i++) {
          let vote = voteRecords[i];
          let voteAmount = new BigNumber(vote.amount);
          if (typeof result[vote.outcome] === "undefined") {
            result[vote.outcome] = voteAmount.toNumber();
          } else {
            result[vote.outcome] = new BigNumber(result[vote.outcome]).plus(voteAmount).toNumber();
          }
          console.log("vote amount", voteAmount.toNumber());
          votePoolTotal = votePoolTotal.plus(voteAmount);
        }
        
        console.log("votePoolTotal: ", votePoolTotal);
        //votePoolTotal = votePoolTotal + marketSelector(state, marketId).challenge.amount;
        console.log("vote result", result);
        localContractStorage.setValue("voteResult", result);

        // determine which outcome win.
        // loop through to find the highest voted amount
        let highestOutcome; // the outcome with highest votes.  
        let highestOutcomeAmount = new BigNumber(-1); // the staked token amount of highest-voted outcome
        for (let outcome in result) {
          let outcomeAmount = new BigNumber(result[outcome]); // the amount of votes (amount of tokens) for the this outcome
          if (outcomeAmount.gt(highestOutcomeAmount)) {
            highestOutcome = outcome;
            highestOutcomeAmount = outcomeAmount;
          }
        }
        console.log("voted outcome: " + highestOutcome + ".  tokens staked for voted outcome: " + highestOutcomeAmount.toNumber());

        // set the final outcome to the highest voted outcome
        finalOutcome = highestOutcome;
        console.log("final voted outcome: ", finalOutcome);
        localContractStorage.setValue("votedOutcome", finalOutcome);

        console.log("distributed vote pool");
        doPayout("vote", finalOutcome, voteRecords, state, marketId);
        
        
      }

      // distribute the original bet pool to the people
      // let betPoolTotal = 0;
      let bets = marketSelector(state, marketId).bets;
      // for (let j = 0; j < bets.length; j++) {
      //   console.log("6");
      //   let bet = bets[j];
      //   betPoolTotal += bet.amount;
      // }
      
      doPayout("bet", finalOutcome, bets, state, marketId);



      // if (challenged)
      //   update the final outcome according to voting results
      //   distributed the staked coins (in challenge and vote phase) according to votign results.
      // distribute coins according to result
      // condition to end phase: when everything in the phase is executed

      console.log("distribute done");
    } else {
      console.log("wrong phase. distribute call can only be done in distribute phase.");
    }
  }
}

/**
 * send token (balances) from a to b
 * @param {*} state 
 * @param {*} tx 
 * @param {*} chainInfo 
 */
function txSendHandler(state, tx, chainInfo) {
  if (tx.type === "send") {
    let cloned = Object.assign({}, tx);
    console.log("send tx: ", JSON.stringify(cloned));
    let from = cloned.from;
    let amount = new BigNumber(from.amount);

    let verifyResult = verifySig(state, cloned);
    if (!verifyResult.verified) {
      console.log('invalid signature!');
      throw Error('invalid signature!');
    }

    console.log("signature verified!");
    let fromAddr = verifyResult.address;
    let toAddr = cloned.to.address;
    
    send(state, fromAddr, toAddr, amount);
  }
}

/**
 * 
 * @param {*} from 
 * @param {*} to 
 * @param {BigNumber} amount 
 */
function send(state, from, to, amount) {
  console.log("send " + amount + " from " + from + " to " + to);
  let fromBalance = new BigNumber(state.balances[from]);
  let newFromBalance = fromBalance.minus(amount);
  if (newFromBalance < 0) { 
    let msg = "not enough balance to send " + amount + " from " + from;
    console.log(msg);
    throw Error(msg); 
  }
  state.balances[from] = newFromBalance.toNumber();

  let toBalance = new BigNumber(state.balances[to]);
  state.balances[to] = toBalance.plus(amount).toNumber();
}

/**
 * verify that seq in state matches seq in tx.
 * @param {*} state 
 * @param {string} user 
 */
function verifySeq(state, user, sequence) {
  let seq = stateUtil.getSeqForUser(state, user);
  return (typeof sequence !== "undefined")
    && ((typeof seq === "undefined" && sequence === STARTING_SEQ) || (sequence === seq));
}

/**
 * verify is signature is correct.  
 * 
 * @param {*} tx 
 * @return {verified: [boolean], address: [string]}
 * verified is true if signature is verified.  and if user is provided, addr is same as user.
 * address is the address derived form the public key provided in tx.from.pubkey.
 */
function verifySig(state, tx) {
  let verified = false;
  let addrSame = true;
  let seqVerified = false;
  let cloned = Object.assign({}, tx);
  console.log("verifySig tx: ", JSON.stringify(cloned));
  let from = cloned.from;
  let pubkey = from.pubkey;
  let signature = from.signature;
  let fromSequence = from.sequence;
  let sigHash = getSigHash(tx);
  let fromAddr = addressHash(pubkey);
  console.log("pubkey: ", pubkey);
  console.log("signature: ", signature);
  console.log("sigHash: ", sigHash);
  console.log("from addr: ", fromAddr);
  console.log("from sequence: ", fromSequence);
  let user = cloned.user;
  if (typeof cloned.user !== "undefined") {
    addrSame = (fromAddr == user);
  }

  // verify signature
  if (!secp.verify(sigHash, signature, pubkey)) {
    console.log('invalid signature! *** ');
    
  } else {
    console.log("signature verified!  ***");
    verified = true;

    seqVerified = verifySeq(state, fromAddr, fromSequence);
    if (seqVerified) {
      let seq = stateUtil.getSeqForUser(state, fromAddr);
      // if sequence is not yet recorded, set sequence to the new value
      // else, increment seq so other people cannot replay the tx.
      if (typeof seq === "undefined") {
        stateUtil.setSeqForUser(state, fromAddr, STARTING_SEQ + 1);
      } else {
        stateUtil.setSeqForUser(state, fromAddr, seq + 1); // seq = seq + 1; won't work 
        //state.seq[fromAddr] = seq + 1; // seq = seq + 1; won't work 
      }
    }
  }

  return {"verified": (verified && addrSame && seqVerified), "address": fromAddr};
}

/**
 * handle a generic key-value storage space in the state.  
 * the storage space is local to the marketId.
 * every market has its own storage space.
 */
class LocalContractStorage {

  
  constructor(state, marketId) {
    this.state = state;
    this.marketId = marketId;
  }

  setValue(key, value) {
    // sets to the state.
    marketSelector(this.state, this.marketId).storage[key] = value;
  }

  getValue(key) {
    return marketSelector(this.state, this.marketId).storage[key];
  }
}

class Event {
  // it is just log
  static Trigger(keyword, string) {
    console.log("[" + keyword + "] " + string);
  }
}

class Blockchain {
  constructor(state) {
    this.state = state;
  }
  
  /**
   * transfer [amount] of tokens to [user]
   * 
   * @param {*} user 
   * @param {*} amount 
   * @return false if not successful.  return a transfer info object if successful.
   */
  static transfer(user, amount, state) {
    let bnAmount = new BigNumber(amount);
    state.balances[user] = new BigNumber(state.balances[user]).plus(bnAmount).toNumber();
    return {"success": true};
  }
}

/**
 * both vote and bet payout distribution logic are mostly the same.  we generalized them together.  
 * @param {string} voteOrBet 
 */
function doPayout(voteOrBet, finalOutcome, bets, state, marketId) {
  let localContractStorage = new LocalContractStorage(state, marketId);

  let keywords = {}; // keywords to multiplex between vote and bet
  if (voteOrBet === "vote") {
    keywords = {
      //betsInfo: "votes",
      distributionInfo: "voteDistribution",
      payoutsInfo: "votePayouts",
      eventKey: "votePayout",
    }

  } else {
    keywords = {
      //betsInfo: "bets",
      distributionInfo: "distribution",
      payoutsInfo: "payouts",
      eventKey: "betPayout",
    }
  }

  //let bets = localContractStorage.get(keywords.betsInfo);
  //let finalOutcome = localContractStorage.get("finalOutcome");
  let bet;
  let user;
  let amount; // BigNumber
  let userOutcome; // not BigNumber
  let payoutAmount; // BigNumber
  let betsIdx = 0;
  let betPoolTotal = new BigNumber(0);
  let winnerPoolTotal = new BigNumber(0);
  let payouts = [];
  let distribution = {
    betPoolTotal: 0,
    winnerPoolTotal: 0,
  }

  if (bets) {
    Event.Trigger(keywords.eventKey, "bets: " + JSON.stringify(bets));

    // calculate bet pool total and winner pool total amount.
    // so we can calculate the payout based on ratio
    // of user bet in the winning pool
    for (betsIdx = 0; betsIdx < bets.length; betsIdx++) {
      bet = bets[betsIdx];
      Event.Trigger(keywords.eventKey, "bets[" + betsIdx + "]: " + JSON.stringify(bet));
      user = bet.user;
      amount = new BigNumber(bet.amount);
      userOutcome = bet.outcome;
      betPoolTotal = betPoolTotal.plus(amount);
      if (finalOutcome == userOutcome) {
        // winner pool
        winnerPoolTotal = winnerPoolTotal.plus(amount);
      }
    }

    Event.Trigger(keywords.eventKey, "betPoolTotal: " + betPoolTotal + ", winnerPoolTotal: " + winnerPoolTotal);
    console.log("betPoolTotal: " + betPoolTotal + ", winnerPoolTotal: " + winnerPoolTotal);
    distribution.betPoolTotal = betPoolTotal;
    distribution.winnerPoolTotal = winnerPoolTotal;
    localContractStorage.setValue(keywords.distributionInfo, distribution);


    for (betsIdx = 0; betsIdx < bets.length; betsIdx++) {
      bet = bets[betsIdx];
      Event.Trigger(keywords.eventKey, "bets[" + betsIdx + "]: " + JSON.stringify(bet));
      user = bet.user;
      amount = new BigNumber(bet.amount);
      userOutcome = bet.outcome;
      console.log("bet: ", bet);
      // payout is user's bet in proportion to the entire pool.
      // payout = ( userAmount / winnerPoolTotal ) * betPoolTotal
      // todo: we might want to floor it to prevent multiple rounding to exceed the total payout
      payoutAmount = amount.times(betPoolTotal).dividedBy(winnerPoolTotal);
      Event.Trigger(keywords.eventKey, "payoutAmount: " + payoutAmount);
      console.log("payoutAmount: ", payoutAmount.toNumber());








      if (finalOutcome == userOutcome) {
        Event.Trigger(keywords.eventKey, "transfer " + payoutAmount + " to " + user);
        console.log("transfer " + payoutAmount + " to " + user);
        var payoutElem = {
          user: user,
          betAmount: amount,
          payoutAmount: payoutAmount,
        }
        payouts.push(payoutElem);


        var result = Blockchain.transfer(user, payoutAmount, state);
        if (!result) {
          Event.Trigger(keywords.eventKey, "transfer failed: " + payoutAmount + " to " + user);
          console.log("transfer failed");
          throw new Error("transfer failed.");
        } else {
          Event.Trigger(keywords.eventKey, "transfer result: " + JSON.stringify(result));
        }
      }
    }

    localContractStorage.setValue(keywords.payoutsInfo, payouts);
    Event.Trigger(keywords.eventKey, "payouts: " + JSON.stringify(payouts));
  }
}

/**
 * remove from and to from the tx.
 * from contains public key and signature, which are buffer.
 * saving buffer into state may cause issue.  the state only seems to handle primitive type. 
 * so we have to clean it up.
 * @param {*} tx 
 */
function cleanSignature(tx) {
  delete tx.from;
  delete tx.to;
}

/**
 * return the market part of the state referred by the marketId
 * @param {Object} state 
 * @param {string} marketId 
 */
function marketSelector(state, marketId) {
  return state.market[marketId];
}

/**
 * return the start and end time for all phase.
 */
function calcPhaseTime(startingBlockHeight) {
  // measured in number of blocks
  const MARKET_DURATION = 3600;
  const ORACLE_DURATION = 3600;
  const CHALLENGE_DURATION = 3600;
  const VOTE_DURATION = 3600;
  const DISTRIBUTE_DURATION = 3600;

  console.log("typeof ", typeof(startingBlockHeight))
  let time = {};
  time.marketStart = startingBlockHeight,
  time.marketEnd = time.marketStart + MARKET_DURATION;
  time.oracleStart = time.marketEnd + 1;
  time.oracleEnd = time.oracleStart + ORACLE_DURATION;
  time.challengeStart = time.oracleEnd + 1;
  time.challengeEnd = time.challengeStart + CHALLENGE_DURATION;
  time.voteStart = time.challengeEnd + 1;
  time.voteEnd = time.voteStart + VOTE_DURATION;
  time.distributeStart = time.voteEnd + 1;
  time.distributeEnd = time.distributeStart + DISTRIBUTE_DURATION;

  return time;
}

/**
 * check if this blockheight is within a particular phase.
 * @return [boolean]
 */
function isInPhase(blockHeight, phase, state) {
  // ***for demo and testing, don't check for timeframe of the phase ***
  return true;
  //


  let result = false;
  switch (phase) {
    case "market":
      result = blockHeight >= marketSelector(state, marketId).phaseTime.marketStart && blockHeight <= marketSelector(state, marketId).phaseTime.marketEnd;
      break;
    case "oracle":
      result = blockHeight >= marketSelector(state, marketId).phaseTime.oracleStart && blockHeight <= marketSelector(state, marketId).phaseTime.oracleEnd;
      break;
    case "challenge":
      result = blockHeight >= marketSelector(state, marketId).phaseTime.challengeStart && blockHeight <= marketSelector(state, marketId).phaseTime.challengeEnd;
      break;
    case "vote":
      result = blockHeight >= marketSelector(state, marketId).phaseTime.voteStart && blockHeight <= marketSelector(state, marketId).phaseTime.voteEnd;
      break;
    case "distribute":
      result = blockHeight >= marketSelector(state, marketId).phaseTime.distributeStart && blockHeight <= marketSelector(state, marketId).phaseTime.distributeEnd;
      break;
    default:
      result = false;
      break;
  }

  return result;
}


const MAX_TYPE_LENGTH = 30;
const MAX_USER_LENGTH = 64;
const SIG_SIZE = 0; // todo
const PUBKEY_SIZE = 0; // todo

/**
 * some common tx checking
 * throw error if not passing
 * 1. type string length <= 30
 * 2. user string length <= 64
 * todo:
 * 3. from.signature size
 * 4. from.pubkey size
 * 5.  
 */
function checkTxCommon(tx) {
  if (tx.type.length > MAX_TYPE_LENGTH) { throw new Error("type too long"); }
  if (typeof tx.user !== "undefined" && tx.user.length > MAX_USER_LENGTH) { throw new Error("user too long"); }
}

const MAX_START_INFO_LENGTH = 1024;

/**
 * total size of startInfo < 1024
 * oracle is defined 
 * oracle is an array
 * question is provided
 * outcomes is provided
 * 
 * throw error if not passing
 */
function checkStartInfo(startInfo) {
  let sStartInfo = JSON.stringify(startInfo);
  if (sStartInfo > MAX_START_INFO_LENGTH) { throw new Error("startInfo too large"); }
  if (typeof startInfo.oracle === "undefined") { throw new Error("startInfo.oracle is required"); }
  if (!Array.isArray(startInfo.oracle)) { throw new Error("startInfo.oracle must be an array"); }
  if (!startInfo.question) { throw new Error("startInfo.question is required"); }
  if (!startInfo.outcomes) { throw new Error("startInfo.outcomes is required"); }
}

/*

prediction market


** market phase **
1. open new market
2. allow bet
3. someone bets (record them)
4. market closes (by time)

** oracle phase **
condition to enter phase: time
10. get data from oracle
11. determine the result and record it
condition to end phase: time

** challenge phase **
condition to enter phase: time, someone triggers it
20. someone stake their coin and challenges
condition to end phase: time

** vote phase **
condition to enter phase: challenge phase completed
30. anyone can stake their coin and vote

** distribute phase **
condition to enter phase: time
40. determine the final outcome
if (challenged)
  update the final outcome according to voting results
  distributed the staked coins (in challenge and vote phase) according to votign results.
distribute coins according to result
condition to end phase: when everything in the phase is executed


** other info **
time is not actual time.  it is block height
*/