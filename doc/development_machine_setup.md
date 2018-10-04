# Development machine setup


## Basic setup
Kanban needs access to the fabcoin-cli executable. 

While we plan to implement a discovery mechanism by which kanban finds the location of the fabcoin client(s),
for the time being Kanban expects two fabcoind executables. The first must be at 

```fabcoin-profile/src/fabcoind```.

The second must be at 

```fabcoin-dev-sm01/src/fabcoind```.

### Ubuntu 16.04+

1. If nodejs is not installed, follow the installation instructions below. To test whether nodejs is installed on your system, execute the command line:

```
node
```

(press ctrl+D to exit).

2. Make sure you've installed all dependencies listed in the Dependencies section.

3. Download Kanban in a folder:
```
git clone git@github.com:blockchaingate/Kanban.git
```

4. Download the fabcoin development trees.
```
cd Kanban
git clone git@github.com:blockchaingate/fabcoin-dev.git fabcoin-dev-sm01
cd fabcoin-dev-sm01
git checkout sm01-kanban
```

5. Compile and build fabcoin. For this follow the website instructions. Alternatively, our Ubuntu installation notes are here:

[intel openCL installation](fabcoind_setup.md)


6. Install nodejs dependencies:

```
cd ..
npm install 
``` 

7. Run kanban:

```
npm run develop
```

Open up your browser and navigate to:

```
http://localhost:51846/
```
or to

```
https://localhost:52907/
```

## Dependencies


At the time of writing, our installation procedure assumes you are working on **Ubuntu**. 
If you are using a different Linux flavor, we would appreciate help with porting 
the commands below to your distribution.

### Node.js

1. Intall nodejs and related.

  - If for some reason you installed a wrong version of nodejs - for example, you installed the default which 
is outdated at the time of writing this readme - then you may:
```
sudo apt remove nodejs
```

  - If not already installed, install curl:

```
sudo apt install curl
```

  - Do the installation as described at:
https://github.com/nodesource/distributions

```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### cmake
1. Install cmake.
```
sudo apt install cmake
```



### OpenCL installation

1. Install opencl:

```
sudo apt install ocl-icd-opencl-dev
```
2. Intel drivers info.

https://software.intel.com/en-us/articles/sdk-for-opencl-gsg 

For convenience, the Ubuntu 16.04 openCL installation script is copied in our repository: [intel openCL installation](miscellaneous/INTEL_Apr_18_install_OCL_driver2.sh)

3. AMD drivers info.

https://support.amd.com/en-us/kb-articles/Pages/Radeon-Software-for-Linux-Release-Notes.aspx

https://support.amd.com/en-us/kb-articles/Pages/Installation-Instructions-for-amdgpu-Graphics-Stacks.aspx


### openssl 
1. Install openssl
```
sudo apt-get install openssl libssl-dev
```


## Obsolete notes

6. (Step obsolete, please skip) Compile the kanban GPU driver. 

```
cd build
make -j4
```

The number in the ``-j4`` flag of the make command tells C++ how many threads to use when compiling. Feel free to adjust 
that number to what you feel is appropriate for your system's processor. Plain ``make`` should compile using a single thread.

7. (Step obsolete, please skip) Test the GPU driver:

```
./kanban-gpu test
```

