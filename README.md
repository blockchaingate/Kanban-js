# Kanban

Kanban is the system used to coordinate FAB coin's decentralized public blockchain with the annex chains. The annex chains may either be decentralized/public or centralized/private. 

Some quick reference links follow. 
1. For development machine setup instructions, see

[development machine setup](doc/development_machine_setup.md)

2. A first draft of our system architecture can be found here.

[architecture](doc/architecture.md)

3. In addition, please also refer to the white paper on our website:

https://fabcoin.co/


## Development roadmap/features
At the moment, Kanban is under intense development; its features are likely to change significantly. 

Stay tuned for more information as the project progresses. 



## To run this kanban-js project

1. Clone kanban-js from github, checkout out to branch master

2. Checkout Kanban-go: 
    1. Go to folder: go/src/github.com/blockchaingate, clone kanban-go project here
    2. Go to ./kanban-go
    3. Checkout branch: `feature/kanban`,  then execute `make`

3. Checkout Fabcoin-dev:
    1. Go to home folder of the project, clone fabcoin-dev here, then go into fabcoin-dev
    2. Checkout branch: `master`
    3. Execute `./autogen.sh`
    4. Execute `./configure` or `./configure --disable-tests`
    5. Execute `make -j6`   (use 6 cores to make)

4. Go to secrets_admin folder, copy configuration_sample.json into configuration.json

6. Go to home folder of the project, execute `npm run develop` (If error "nodemon: command not found" is generated, resolve this problem by `npm install nodemon --save`)

## How To Use Kanban-js
Go to https://localhost:52907

Run fabcoin:
1. Go to page "fabcoin start"
2. Fill in inputbox arguments: "-regtest -printtoconsole" (run in testnet)
3. Click "start fabcoind"
4. All related features can be tested and found in page "fabcoin smart"

Run Kanban:
1. To run kanban, first we need to deploy SCAR.sol on fabcoin
    1. Go to page "fancoin smart", click button "Fetch contract"
    2. Click button "Compile", then click button "Create"
    3. Mine one block by entering "1" into inputbox "# blocks to generate", and clicking button "Mine blocks"
2. Go to page "KanbanGO start", fill in inputboxs: 
    ```
    KB chain: 212
    FAB net: reg
    #of nodes: (number of nodes you want to have, should >= 3)
    ```
3. Click button "Run"
4. Since few registration transactions are needed, go back to "fabcoin smart" and mine 2 more blocks
5. Now Kanban is running

## Deploy & Test Contract On Kanban
### Deployment
1. Compile the contract that you want to test. Or use Remix IDE to compile it
2. Get the bytecode (and abi if you need it)
3. Start Kanban blockchain
4. Fill in "From addr" & "Tx Data"(bytecode)
5. Click "Deploy CoinPool" button
6. Copy the returned tx hash and fill it into "Tx Hash"
7. Click "Get Contract Addr" to get the address

### Testing
1. Here we use Remix to generate abi, 4 bytes function selector and encode input parameter.
2. Fill in "Contract Address" and "Call Contract Data"(encoded parameters)
3. If the state of evm will be changed
    1. Unlock account and then click "send to KBContract" to send transaction
    2. The return value is a transaction hash
4. else, it is a simple function call
    1. Click "Call Contract"
    2. The returned value is encoded. Here we can use [abi decoder](https://adibas03.github.io/online-ethereum-abi-encoder-decoder/#/decode) to decode



