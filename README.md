# Kanban

Kanban is the system used to coordinate FAB coin's decentralized public blockchain with the annex chains. The annex chains may either be decentralized/public or centralized/private. 

1. For development machine setup instructions, see

[development machine setup](doc/development_machine_setup.md)

2. For system architecture, see

[system architecture](doc/architecture.md)

Please bear in mind that this is work in progress.

## Development roadmap/features
At the moment, Kanban is under intense development; its features are likely to change significantly. In the present section, we describe our immediate goals for the near future. 

By design, Kanban is expected to implement only a few limited blockchain operations at the maximum possible speed. Kanban can be ran as an application alongside fabcoin core or as a standalone executable. Kanban should carry out the following operations. Please note that the list below is expected to change rapidly as our work progresses. 

- Verify basic transaction consistency (signatures, transaction validity, etc.).

- Verify transactions against the rules of SCAR.

- Verify transactions against the table of transaction address balances.

- Sign verified transactions.

- Dispatch verified transactions to the open storage network and to the main blockchain.
