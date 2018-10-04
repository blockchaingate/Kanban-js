# Installing developer version of fabcoind on Ubuntu Linux

Instructions from bitcoin repo follow. 

https://github.com/bitcoin/bitcoin/blob/master/doc/build-unix.md

1. Checkout the repository.
2. Navigate to the base folder. 
3. Run 
```
sudo apt-get install autoconf
sudo apt-get install libtool
```

4. For the database installation.

```
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:bitcoin/bitcoin
sudo apt-get update
sudo apt-get install libdb4.8-dev libdb4.8++-dev
```
5. General dependencies.

```
sudo apt-get install build-essential libtool autotools-dev automake pkg-config libssl-dev libevent-dev bsdmainutils python3
```

5. Boost installation.
```
sudo apt-get install libboost-system-dev libboost-filesystem-dev libboost-chrono-dev libboost-program-options-dev libboost-test-dev libboost-thread-dev
```
6. Sodium installation.
```
sudo apt install libsodium-dev
sudo apt install qt-sdk
```

7. Libzmq3 and related: installation.

```
sudo add-apt-repository ppa:chris-lea/zeromq
sudo apt-get update
sudo apt-get install libzmq3-dev
sudo apt-get install protobuf-compiler
```

7. 
```
cd depends
make
```

8. Configure.

```
cd ..
./autogen.sh
```
8.1. Configure with QT wallet.
```
./configure --prefix=`pwd`/depends/x86_64-linux-gnu --with-gui=qt4 # Actually check what folder is created in depends after you built the dependencies and use that instead
make
```
8.2 Configure without QT wallet.
```
./configure --prefix=$Home/work --with-incompatible-bdb 
make
```

9. Make & make install

```
make
make install
```
