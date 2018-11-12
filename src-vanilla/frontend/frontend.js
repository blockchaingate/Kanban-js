window.kanban = {
  thePage: null,  
  rpc: {
    forceRPCPOST: false
  },
  kanbanJS: {
    crypto: require('./kanbanjs/crypto')
  },
  kanbanPlusPlus: {
    general: require('./kanban_plus_plus')
  },
  kanbanGO: {
    rpc: null,
  },
  fabcoin: {
    initialization: require('./fabcoin/initialization'),
    rpc: require('./fabcoin/rpc')
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
  ace: {
    ace: require('./brace'),
    editor: null
  },
  themes: require('./themes'),
  storage: require('./storage').storage,
};

window.kanban.kanbanGO.rpc = require('./kanbango/rpc'); // <- function call uses window.kanban

window.kanban.thePage = require('./main_page').getPage(); // <- function call uses window.kanban
window.kanban.computationalEngineCalls = require('./computational_engine_calls'); // <- module loading uses window.kanban
