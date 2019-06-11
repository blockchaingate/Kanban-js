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



## To run this kanban-js project:

1. Clone kanban-js from github, checkout out to branch master

2. Checkout Kanban-go: 
    1. Go to folder: go/src/github.com/blockchaingate, clone kanban-go project here
    2. Go to ./kanban-go,  then execute make

3. Checkout Fabcoin-dev:
    1. Go to home fold of the project, clone fabcoin-dev here, then go into fabcoin-dev
    2. Execute ./autogen.sh
    3. Execute ./configure -- disable-tests
    4. make -j6   (use 6 cores to make)

4. Go to secrets_admin fold, copy configuration_sample.json into configuration.json

5. Go to home fold of the project, execute npm run develop
