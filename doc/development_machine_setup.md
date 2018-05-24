# Development machine setup
To install Kanban, you need to install:

  - nodejs 
  - openssl
  - openCL
  - cmake

We expect the list to be expanded to include mongoDB. The list of required technologies is expected to grow further as our work progresses. 

We would like to automate Kanban's installation procedure as much as possible. Until that happens, please follow the present guide.


If possible, please take notes while installing Kanban. 
What you note down is likely going to be something that needs to be added to the present instructions.


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

6. Compile the kanban GPU driver. 

```
cd build
make -j4
```

The number in the ``-j4`` flag of the make command tells C++ how many threads to use when compiling. Feel free to adjust 
that number to what you feel is appropriate for your system's processor. Plain ``make`` should compile using a single thread.

7. Test the GPU driver:

```
./kanban-gpu test
```
8. Run kanban:

```
cd ..   #to go back to Kanban's base folder
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



