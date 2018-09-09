/*
 * simple util functions related to state
 */

/**
 * get sequence part of state
 * @param {*} state 
 */
function getSeq(state) {
  return state.seq;
}

/**
 * get sequence for a specific user
 * @param {*} state 
 * @param {string} user - address
 */
function getSeqForUser(state, user) {
  return getSeq(state)[user];
}

function getBalances(state) {
  return state.balances;
}

/**
 * 
 * @param {*} state 
 * @param {string} user - address 
 */
function getBalancesForUser(state, user) {
  return getBalances(state)[user];
}

function getMarket(state) {
  return state.market;
}

/**
 * 
 * @param {*} state 
 * @param {string} marketId
 */
function getMarketForId(state, marketId) {
  return getMarket(state)[marketId];
}

