window.kanban = {
  thePage: null,
  rpc: {
    general: require('./fabcoin_old/fabcoin_rpc_general'),
    network: require('./fabcoin_old/fabcoin_rpc_network'),
    sendReceive: require('./fabcoin_old/fabcoin_rpc_send_receive'),
    mine: require('./fabcoin_old/fabcoin_rpc_mine'),
    profiling: require('./fabcoin_old/fabcoin_rpc_profiling'),
    forceRPCPOST: false
  },
  kanbanJS: {
    crypto: require('./kanbanjs/crypto')
  },
  kanbanPlusPlus: {
    general: require('./kanban_plus_plus')
  },
  kanbanGO: {
    rpc: require('./kanbango/rpc'),
  },
  fabcoin: {
    initialization: require('./fabcoin/initialization'),
    rpc: require('./fabcoin/rpc')
  },
  fabcoinOLD: {
    initializationOLD: require('./fabcoin_old/fabcoin_initialization'),
  },
  miscellaneous: require('./miscellaneous_frontend'),
  computationalEngineCalls: null,
  submitRequests: require('./submit_requests'),
  ids: require('./ids_dom_elements'),
  myNodes: require('./my_nodes'),
  allMyNodes: null,
  profiling: {
    memoryPoolArrivalTimes: null,
    statistics: {},
    statDetails: {}
  },
	ace: require('./ace'),
};

window.kanban.thePage = require('./main_page').getPage(); // <- function call uses window.kanban
window.kanban.computationalEngineCalls = require('./computational_engine_calls'); // <- module loading uses window.kanban
