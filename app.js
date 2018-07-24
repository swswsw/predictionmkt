let lotion = require('lotion')

// initial state
// for demo purpose, we initialize the system with an opened prediction market.
let initMarket1 = {
  id: 1, // market id
  phaseTime: {}, // the start and end time of each phase (time in blockheight)
  bets: [],
  oracles: [], // list of approved oracles when market is created
  oracleOutcome: -1, // for hackathon, we only have one oracle, so we makes it simple.
                    // just one single result.  outcome is specified by 1, 2, ....
                    // 0 indicate no outcome yet
  //oracleOutcomes: [], // when oracle pushes the result, it is stored here.
  challenge: {},
  voteRecords: [], // list of all vote
  // votes: {
  //   outcome1: 0,
  //   outcome2: 0,
  //   outcome3: 0,
  // }, // aggregated result of vote
  payoutRatio: 1.5,
}

let initialState = {
  market1: initMarket1,
  balances: {
    'alice': 10000,
    'bob': 10000,
    'carol': 10000,
  },
}

//

/*
format of start tx
{
  type: "start",
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

app.use(txHandler1);
app.use(txHandler2);
app.use(txStartHandler);
app.use(txBetHandler);
app.use(txOracleHandler);
app.use(txChallengeHandler);
app.use(txVoteHandler);
app.use(txDistributeHandler);


app.listen(3000).then(function(appInfo) {
  console.log(appInfo);
})


function txHandler1(state, tx, chainInfo) {
  console.log("tx: ", tx);
  //console.log(chainInfo);
}

function txHandler2(state, tx, chainInfo) {
  console.log("block height: ", chainInfo.height);
}

function txStartHandler(state, tx, chainInfo) {
  if (tx.type === "start") {
    // starting the market.
    // calculate the phase time
    let cloned = Object.assign({}, tx);
    console.log("start: ", cloned);
    let blockHeight = chainInfo.height;
    var t1 = 1;
    let phaseTime = calcPhaseTime(blockHeight);
    state.market1.phaseTime = phaseTime;
    console.log("phaseTime: ", state.market1.phaseTime);
  }
}

function txBetHandler(state, tx, chainInfo) {
  if (tx.type === "bet") {
    // ignore request if it is outside of a particular phase timeframe
    if (isInPhase(chainInfo.height, "market", state)) {
      let cloned = Object.assign({}, tx);
      console.log("bet: ", cloned);
      let user = cloned.user;
      let amount = cloned.amount;
      // lock up their staking tokens
      state.balances[user] = state.balances[user] - amount;
      state.market1.bets.push(cloned);
      console.log("bets: ", state.market1.bets);
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
      console.log("oracle tx: ", cloned);
      state.market1.oracleOutcome = cloned.outcome;
      console.log("oracleOutcome: ", state.market1.oracleOutcome);
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
      console.log("challenge tx: ", cloned);
      let user = cloned.user;
      let amount = cloned.amount;
      // lock up their staking tokens
      state.balances[user] = state.balances[user] - amount;
      state.market1.challenge = cloned;
      console.log("challenge: ", state.market1.challenge);
    } else {
      console.log("wrong phase. challenge call can only be done in challenge phase.");
    }
  }
}

/**
 * check if challenge has been issued
 * (if the state contains challenge info)
 */
function challenged(state) {
  let obj = state.market1.challenge;
  // check if challenge object is still empty
  return !(Object.keys(obj).length === 0 && obj.constructor === Object)
}

function txVoteHandler(state, tx, chainInfo) {
  if (tx.type === "vote") {
    // ignore request if it is outside of a particular phase timeframe
    if (isInPhase(chainInfo.height, "vote", state)) {
      console.log("skip voter verification and balance verification for hackathon");
      if (challenged(state)) {
        let cloned = Object.assign({}, tx);
        console.log("vote tx", cloned);
        let user = cloned.user;
        let amount = cloned.amount;
        let outcome = cloned.outcome;
        // lock up their staking tokens
        state.balances[user] = state.balances[user] - amount;
        state.market1.voteRecords.push(cloned);
        // update votes
        //updateVotes(outcome, amount);
        console.log("vote records: ", state.market1.voteRecords);
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
  // if (! (outcome in state.market1.votes) ) {
  //   console.log("3");
  //   state.market1.votes[outcomeName] = 0;
  //   console.log("4");
  // }
  state.market1.votes[outcomeName] = state.market1.votes[outcomeName] + amount;
}

function txDistributeHandler(state, tx, chainInfo) {
  if (tx.type === "distribute") {
    // ignore request if it is outside of a particular phase timeframe
    if (isInPhase(chainInfo.height, "distribute", state)) {
      // do final calculation and distribute the tokens accordingly.

      // if challenge is there
      if (Object.keys(state.market1.challenge).length > 0) {
        // take the challenge pool + voting pool
        // distribute to the winner of the voter who vote for it.
        console.log("challenge was requested");

        // sum up voting pool.
        // give it to the winners proportionally.
        let voteRecords = state.market1.voteRecords;
        console.log("1");
        let votePoolTotal = 0;
        for (let i = 0; i < voteRecords.length; i++) {
          let vote = voteRecords[i];
          //let result = {};
          //result[vote.outcome] =
          console.log("vote amount", vote.amount);
          votePoolTotal += vote.amount;
        }
        console.log("votePoolTotal: ", votePoolTotal);
        //votePoolTotal = votePoolTotal + state.market1.challenge.amount;
        // for demo purpose, just give all the pool to alice
        // sorry, demo only code here.
        state.balances['alice'] += votePoolTotal;
        console.log("distributed vote pool");
      }

      // distribute the original bet pool to the people
      console.log("5");
      let betPoolTotal = 0;
      let bets = state.market1.bets;
      for (let j = 0; j < bets.length; j++) {
        console.log("6");
        let bet = bets[j];
        betPoolTotal += bet.amount;
      }
      console.log("10");
      state.balances['alice'] += betPoolTotal;
      console.log("11");


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
      result = blockHeight >= state.market1.phaseTime.marketStart && blockHeight <= state.market1.phaseTime.marketEnd;
      break;
    case "oracle":
      result = blockHeight >= state.market1.phaseTime.oracleStart && blockHeight <= state.market1.phaseTime.oracleEnd;
      break;
    case "challenge":
      result = blockHeight >= state.market1.phaseTime.challengeStart && blockHeight <= state.market1.phaseTime.challengeEnd;
      break;
    case "vote":
      result = blockHeight >= state.market1.phaseTime.voteStart && blockHeight <= state.market1.phaseTime.voteEnd;
      break;
    case "distribute":
      result = blockHeight >= state.market1.phaseTime.distributeStart && blockHeight <= state.market1.phaseTime.distributeEnd;
      break;
    default:
      result = false;
      break;
  }

  return result;
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
