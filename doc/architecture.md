# System Architecture

The system has two main components: the foundation chain (fabcoin-dev) and kanban (kanban-go), and one auxiliary component, the system driver (kanban-js). 

## Foundation chain
The foundation chain is run through the fabcoind executable and provides basic bitcoin-like transaction system, protected against double-spending by proof of work (mining).

1. Based on the architecture and code of the Qtum cryptocurrency (which in turn is based on Ethereum), our foundation chain supports Ethereum-like smart contracts. More precisely, our system runs the Ethereum Virtual machine with several modifications. Those changes are relatively small in terms of lines of code, however have significant implications. Most importantly, the address computation function in our system is ``RIPEMD160(SHA2_256(public_key))``, rather than Ethereum's ``keccak(public_key)[12:]`` (last 20 bytes of keccak).

# Kanban 

Kanban is an array of fast transaction system(s) that run in parallel to fabcoind. Kanban clears transactions through the use of authorized kanban nodes.

## Distinguished Kanban nodes

In the present paragraph, we give a high-level overview of the distinguished kanban nodes. For technical details on the registration process, we direct the reader to


...

1. The authority of the distinguished Kanban nodes is derived through registering their public keys on the foundation chain. In this way, the kanban system carries the benefits of a centralized system (speed and responsiveness). At the same time, since the registration process is open to everyone on the foundation chain, the kanban system retains the benefits of a decentralized system.

2. Kanban can also be run as a non-distinguished node. In this case, the non-distinguised Kanban has two purposes. First, it serves as a gateway/connection to the distinguished kanban nodes. Second, and very important, it verifies the work of the distinguished kanban nodes. In particular each non-distinguished kanban node has the same powers of verification and access to data as the distinguished kanban nodes. These checks include full checks of the signatures of each transaction cleared, as well as checks of the aggregate signatures of the distinguished nodes.

In fact, there are only two powers not available to a non-distinguished node. First, the non-distinguished nodes cannot mine/approve a new block in the kanban chain - but can still reject locally corrupted blocks. Second, the non-distinguished nodes cannot generate write-back transactions to the foundation chain - but still have read access and can verify them. 

3. Each kanban subsystem is identified by a unique SCAR (Smart Contract Agent Router) address [20 bytes]. The number of SCAR contracts and kanban subsystems is practically unlimited (2^160 possible addresses).

4. During registration, each distinguished Kanban node registers itself to a particular SCAR address. 

5. At the time of writing, Kanban's registration process is frozen for a particular SCAR address once a given minimal number of nodes register themselves as distinguished Kanban go nodes, and a shard-start command is issued. Once the registration is frozen, the SCAR address can no longer have new distinguished Kanban node registrations.

At the time of writing, if a node wants to run as a distinguished Kanban node and there are no open SCAR addresses available, the node needs to deploy a new SCAR address.

6. As promised by our white-paper, in a future version, we plan to allow dynamic registration of distinguished nodes on an already running SCAR address. We expect to carry out the dynamic distinguished node registration process through the process of sharding, as described by our white paper.

## Use of Kanban

The ultimate goal of Kanban is to facilitate fast transactions for our users. In the present paragraph we briefly describe the intended use of Kanban from the perspective of a regular user. We present only a high-level overview; more details can be found in:

(To do: please write the documentation).

In its shortest form, the use of Kanban follows the following procedure.

1. The user transfers money to ("adds deposit to") to SCAR on the foundation chain.
2. SCAR creates the corresponding money on the KanbanGo chain using a reference to the "external" foundation chain event for justification.
3. The user carries transactions fast on the KanbanGo chain for a long period of time. Fast transactions are restricted within the SCAR address.
4. The user withdraw his funds from KanbanGo. More precisely, the following happens. 
- On the foundation chan, money transfered from SCAR back to the user.
- On the KanbanGo chain, money is "removed" with a reference to the SCAR transaction that causes the removal. 


### Funds on Kanban and the foundation chain
1. The user is assumed to own money on the foundation chain via a number of addresses. 

2. The user can also own money within each SCAR instance (identified via its SCAR address). The money is accounted using the same address bytes, but stays within the given SCAR instance, in other words, the money in SCAR is identified via the SCAR address and the user address. 


### Adding deposit to Kanban
Here we elaborate on how money is moved from the user to Kanban
1. The user chooses a SCAR address of a running Kanban chain.

4. The user sends money to the SCAR address on the foundation chain via a smart contract call (at the time of writing, this is the ``addDeposit`` SCAR function call). 

3. Since the money is sent on the foundation chain, the user needs to wait for his transaction to be mined and stored in a block sufficiently deep in the foundation chain. 

4. When the money is received by a SCAR address, the SCAR contract records the event and (after sufficient mining as described above), the corresponding monetary value is added to the 
