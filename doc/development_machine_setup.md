# Development machine setup
To install Kanban, you need to install:

  - nodejs 
  - openssl
  - openCL
  - cmake

We expect the list to be expanded to include mongoDB. The list of required technologies is expected to grow further as our work progresses. 




## Basic setup
Kanban needs access to the fabcoin-cli executable. 

While we plan to implement a discovery mechanism by which kanban finds the location of the fabcoin-cli executable,
for the time being Kanban expects it to be located at

```fabcoin-dev/src/fabcoin-cli```, 

where the ```fabcoin-dev``` folder is located alongside the ```Kanban``` base folder. **This folder structure is expected to be relaxed in the future.** 

### Ubuntu 16.04+

1. If nodejs is not installed, follow the installation instructions below. To test whether nodejs is installed on your system, execute the command line:

```
node
```

(press ctrl+D to exit).

2. Make sure you've installed all dependencies listed in the Dependencies section.

3. If you haven't done so already, download the fabcoin-dev project. Make sure the **```fabcoin-dev project``` is downloaded in a folder bearing the same name**.


4. Download Kanban in a folder alongside the ```fabcoin-dev``` base folder:
```
git clone git@github.com:blockchaingate/Kanban.git
```

5. Install nodejs dependencies:

```
cd Kanban
npm install 
``` 


## Dependencies

### Node.js

#### Ubuntu
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

#### Ubuntu

1. Install opencl:

```
sudo apt install ocl-icd-opencl-dev
```
2. You may want to look into installing the Intel openCL drivers:

https://software.intel.com/en-us/articles/sdk-for-opencl-gsg 

For convenience, the Ubuntu 16.04 openCL installation script is copied in our repository: [intel openCL installation](miscellaneous/INTEL_Apr_18_install_OCL_driver2.sh)

### openssl 
1. Install openssl
```
sudo apt-get install openssl libssl-dev
```



