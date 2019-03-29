
The system has two main components: the foundation chain (fabcoin-dev) and kanban (kanban-go), and one auxiliary component, the system driver (kanban-js). 

# Foundation chain
The foundation chain is run through the fabcoind executable and provides basic bitcoin-like transaction system, protected against double-spending by proof of work (mining).

1. Based on the architecture and code of the Qtum cryptocurrency (which in turn is based on Ethereum), our foundation chain supports Ethereum-like smart contracts. More precisely, our system runs the Ethereum Virtual machine with several modifications. Those changes are relatively small in terms of lines of code, however have significant implications. Most importantly, the address computation function in our system is ``RIPEMD160(SHA2_256(public_key))``, rather than Ethereum's ``keccak(public_key)[12:]`` (last 20 bytes of keccak).

# Kanban 

Kanban is an array of fast transaction system(s) that run in parallel to fabcoind. Kanban clears transactions through the use of distinguished (authorized) kanban nodes.

## Distinguished Kanban nodes

In the present paragraph, we give a high-level overview of the distinguished kanban nodes. For technical details on the registration process, we direct the reader to


(To do: please write more documentation).


1. The authority of the distinguished Kanban nodes is derived through registering their public keys on the foundation chain. In this way, the kanban system carries the benefits of a centralized system (speed and responsiveness). At the same time, since the registration process is open to everyone on the foundation chain, the kanban system retains the benefits of a decentralized system. The distinguished Kanban nodes reach consensus via their aggregate signature. Details on aggregate signature can be found here.

- Mathematical foundations

  - [Preliminaries](architecture/lectures/FAB-aggregate-signature/pdf/FAB_aggregate_signature1_preliminaries_elliptic_curves_slides.pdf)

  - [Aggregate signature](architecture/lectures/FAB-aggregate-signature/pdf/FAB_aggregate_signature2_signatures_elliptic_curves_slides.pdf)

- Cryptography technical documentation

  - [Preliminaries](https://github.com/blockchaingate/kanban-go/blob/feature/kanban/crypto_kanban/doc/secp256k1_kanban.md)

  - [Schnorr and aggregate Schnorr signatures](https://github.com/blockchaingate/kanban-go/blob/feature/kanban/crypto_kanban/doc/secp256k1_kanban_schnorr_signature.md)
  
- [Networking documentation](https://github.com/blockchaingate/kanban-go/blob/feature/kanban/pbft_node/doc/aggregate_signature_networking.md)


2. Kanban can also be run as a non-distinguished node. In this case, the non-distinguised Kanban has two purposes. First, it serves as a gateway/connection to the distinguished kanban nodes. Second, and very important, it verifies the work of the distinguished kanban nodes. In particular each non-distinguished kanban node has the same powers of verification and access to data as the distinguished kanban nodes. More precisely, non-distinguished nodes carry out full checks of the signatures of each transaction cleared, as well as checks of the aggregate signatures of the distinguished nodes.

In fact, there are only two powers not available to a non-distinguished node. First, a non-distinguished node cannot mine/approve a new block in the kanban chain - but can still reject corrupted blocks. Second, the non-distinguished nodes cannot generate write-back transactions to the foundation chain - but still have read access and can verify them. 

3. Each kanban subsystem is identified by a unique SCAR (Smart Contract Agent Router) address [20 bytes]. The number of SCAR contracts and kanban subsystems is practically unlimited (2^160 possible addresses).

4. During registration, each distinguished Kanban node registers itself to a particular SCAR address. 

5. At the time of writing, for a particular SCAR address, Kanban's registration process gets frozen once a minimal number of distinguished nodes are registered and a shard-start command is issued. Once frozen, the SCAR address can no longer have new distinguished Kanban node registrations.

At the time of writing, if a node wants to run as a distinguished Kanban node and there are no open SCAR addresses available, the node needs to deploy a new SCAR address.

6. As promised by our white-paper, in a future version, we plan to allow dynamic registration of distinguished nodes on an already running SCAR address. We expect to carry out the dynamic distinguished node registration process through the process of sharding, as described by our white paper.

## Use of Kanban

The ultimate goal of Kanban is to facilitate fast transactions for our users. In the present paragraph we briefly describe the intended use of Kanban from the perspective of a regular user. We present only a high-level overview; more details can be found in:

(To do: please write the documentation).

In its shortest form, the use of Kanban follows the following procedure.

1. The user transfers money to ("adds deposit to") to SCAR on the foundation chain.
2. SCAR creates the corresponding money on the KanbanGo chain using a reference to the "external" foundation chain event for justification.
3. The user carries transactions fast on the KanbanGo chain for a long period of time. Fast transactions are restricted within the SCAR address.
4. The user withdraws his/her funds from KanbanGo. More precisely, the following happens. 
- On the foundation chan, money transfered from SCAR back to the user.
- On the KanbanGo chain, money is "removed" with a reference to the SCAR transaction that causes the removal. 


### Funds on Kanban and the foundation chain
1. The user is assumed to own money on the foundation chain via a number of addresses. 

2. The user can also own money within each kanban instance (identified via its SCAR address). The user can own money in multiple addresses; the addresses are functions of the private key just as in Fabcoin. The same address can be used in multiple kanban instances/scar addresses. It is therefore allowed to use the same address in two different kanban instances; the two addresses are considered distinct and can hold different values.

In other words, money stored in kanban/SCAR is identified via the pair (SCAR address, user address).


### Adding deposit to Kanban
Here we elaborate on how money is moved from the user's address on the foundation chain to Kanban. 

1. The user chooses a SCAR address of a running Kanban chain.

2. The user sends money to the SCAR address on the foundation chain via a smart contract call (at the time of writing, this is the ``addDeposit`` SCAR function call). 

3. Since the money is sent on the foundation chain, the user needs to wait for his transaction to be mined and stored in a block sufficiently deep in the foundation chain. 

4. When the money is received by a SCAR address, the SCAR contract records the event and (after sufficient mining as described above), the corresponding monetary value is added to the kanbanGO chain.

### Making transfers on the kanbanGO chain

The mechanism for making transfers on the kanbanGO chain is inherited from Ethereum. There should be no significant workflow changes; the only thing that the user needs to pay attention to is that our address format is that of bitocin (``RIPEMD160(SHA2_256(public_key))``). 

### Withdrawals form kanbanGo back to the foundation chain
Here we elaborate on how money is moved from Kanban/SCAR back to the foundation chain.

1. The user requests withdrawal of funds on the Kanban chain. The mechanism for doing is being worked on at the very time of writing. The expected implementation is that the user transfers funds on the Kanban chain to a distinguished address (an address for which noone owns the private key). One such address could be 0xfff...

2. This transfer is mined, i.e., approved by the distinguished Kanban nodes and included in a block. The block is sealed with the aggregate signature of the distinguished Kanban nodes.

3. The mining of the block triggers the write-back sequence described below.

- A withdrawal request (with possible fees subtracted - to be determined later) on SCAR is formed.
- The withdrawal request is wrapped into a foundation chain write-back transaction.
- The resulting foundation chain write-back transaction is signed by the aggregate signature of all distinguished nodes.
- The completed aggregate-signed write-back transaction is "immortalized" on the kanbanGO chain. 

-- At the time of writing, this write-back happens by writing the completed writeback transaction in the block header of the first available block.

-- In the future, this writeback may be moved to the block body (details to be determined later).

- The "immortalized" aggregate-signed write-back transaction is submitted to the foundation chain. This is done automatically by the distinguished nodes. Please note that anyone can submit the aggregate-signed transaction to the foundation chain: should the distinguished note have a failure in their communication with fabcoind, a regular user could manually submit the aggregate-signed transaction. The thing needed here is that the entity that submits the write-back transaction has access to the kanbanGo block header where the aggregate-signed transaction was "immortalized". 

4. The write-back transaction is mined on the foundation chain. This can take a while.

5. The write-back transaction causes the transfer of funds back to the Fabcoin address that triggered the withdrawal. More precisely, the beneficiary fabcoin address is the fabcoin-encoded equivalent of the Kanban address that initiated Step 1. 
