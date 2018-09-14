/*
 * simple util functions related to state
 */

// simple namespace
var ns = {};

/**
 * get sequence part of state
 * @param {*} state 
 */
ns.getSeq = function(state) {
  return state.seq;
}

/**
 * get sequence for a specific user
 * @param {*} state 
 * @param {string} user - address
 */
ns.getSeqForUser = function(state, user) {
  return ns.getSeq(state)[user];
}

/**
 * set sequence for a specific user
 * @param {*} state 
 * @param {*} user 
 * @param {*} sequence 
 */
ns.setSeqForUser = function(state, user, sequence) {
  ns.getSeq(state)[user] = sequence;
}

ns.getBalances = function(state) {
  return state.balances;
}

/**
 * 
 * @param {*} state 
 * @param {string} user - address 
 */
ns.getBalancesForUser = function(state, user) {
  return ns.getBalances(state)[user];
}

ns.getMarket = function(state) {
  return state.market;
}

/**
 * 
 * @param {*} state 
 * @param {string} marketId
 */
ns.getMarketForId = function(state, marketId) {
  return ns.getMarket(state)[marketId];
}


// Export all in ns namespace
for(prop in ns) {
  if(ns.hasOwnProperty(prop)) {
    module.exports[prop] = ns[prop];
  }
}
