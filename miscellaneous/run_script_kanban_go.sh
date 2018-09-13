cd ../go/src/github.com/blockchaingate/kanban-go/
echo $PWD
make all
cd ../../../../../miscellaneous
echo $PWD
../go/src/github.com/blockchaingate/kanban-go/build/bin/geth  --datadir "~/.kanban-go" --networkid "211" --port "44444" --identity "node4" --rpcport 4444 --syncmode "full" --nodiscover --mine --rpc --rpcaddr "0.0.0.0"  --rpccorsdomain "*"
#--verbosity 100
