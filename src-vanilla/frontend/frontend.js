window.kanban = {
  thePage: null,
  rpc: {
    general: require('./fabcoin_rpc_general'),
    network: require('./fabcoin_rpc_network'),
    sendReceive: require('./fabcoin_rpc_send_receive'),
    mine: require('./fabcoin_rpc_mine'),
    profiling: require('./fabcoin_rpc_profiling'),
    profiling: require('./fabcoin_rpc_profiling'),
    forceRPCPOST: false
  },
  kanbanPlusPlus: {
    general: require('./kanban_plus_plus')
  },
  kanbanGO: {
    general: require('./kanban_go')
  },
  fabcoinInitialization: require('./fabcoin_initialization'),
  computationalEngineCalls: null,
  submitRequests: require('./submit_requests'),
  ids: require('./ids_dom_elements'),
  myNodes: require('./my_nodes'),
  allMyNodes: null,
  profiling: {
    memoryPoolArrivalTimes: null,
    statistics: {},
    statDetails: {}
  }
};

window.kanban.thePage = require('./main_page').getPage(); // <- function call uses window.kanban
window.kanban.computationalEngineCalls = require('./computational_engine_calls'); // <- module loading uses window.kanban