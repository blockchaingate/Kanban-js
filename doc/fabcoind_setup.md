# Installing developer version of fabcoind on Ubuntu Linux within Kanban


1. Checkout the fabcoin repo in ``fabcoin-dev-sm01``. The current instructions
assume that we are working off branch sm01. Should that change, replace sm01 in 
the relevant branch you need to work on. 

```
  #  starting folder assumed to be the kanban base folder.
git clone git@github.com:blockchaingate/fabcoin-dev.git fabcoin-dev-sm01
cd fabcoin-dev-sm01
git checkout sm01
```
2. Generate the configure file.
```
sudo apt-get install autoconf
sudo apt-get install libtool
```

3. Configure the project.

3.1 Without wallet support (recommended). 
```
./configure   --disable-bench --without-gui --disable-tests

```
3.2 With wallet support (not recommended).
```
./configure --prefix=`pwd`/depends/x86_64-linux-gnu --with-gui=qt4 # Actually check what folder is created in depends after you built the dependencies and use that instead
make
```

If nothing fails, go to Step 4. Else checkout Step 5, and return here when done.

4. Make the project 

```
make -j 10
```

The number 10 above is the number of cores to use, in this case 10. 
Replace that number with what is appropriate for your machine.

If everything goes through you are done. 

If something fails in the make, it's most likely a 
missing library or a bad library version.
In that case, go to step 5.

5. For the database installation.

```
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:bitcoin/bitcoin
sudo apt-get update
sudo apt-get install libdb4.8-dev libdb4.8++-dev
```
6. General dependencies.

```
sudo apt-get install build-essential libtool autotools-dev automake pkg-config libssl-dev libevent-dev bsdmainutils python3

sudo apt-get install libssl-dev
```

7. Libevent.
```
sudo apt-get install libevent-dev
```

8. Boost installation.
```
sudo apt-get install libboost-system-dev libboost-filesystem-dev libboost-chrono-dev libboost-program-options-dev libboost-test-dev libboost-thread-dev
```
9. Sodium installation.
```
sudo apt install libsodium-dev
sudo apt install qt-sdk
```

10. Libzmq3 and related: installation.

```
sudo add-apt-repository ppa:chris-lea/zeromq
sudo apt-get update
sudo apt-get install libzmq3-dev
sudo apt-get install protobuf-compiler
```
