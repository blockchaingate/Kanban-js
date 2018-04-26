# Kanban

To do: write installation instructions.


## Dev machine setup

### Opencl installation

#### Ubuntu

1. Install opencl:

```
sudo apt install ocl-icd-opencl-dev
```
2. You may want to look into installing the Intel openCL drivers:

https://software.intel.com/en-us/articles/sdk-for-opencl-gsg 

For convenience, the openCL installation script is copied in our repository: [intel openCL installation](miscellaneous/INTEL_Apr_18_install_OCL_driver2.sh)


### Node.js installation instructions


#### Ubuntu 16.04
1. Intall nodejs. 

1.1. If for some reason you installed a wrong version of nodejs - for example, you installed the default which 
is outdated at the time of writing this readme - then you may:
```
sudo apt remove nodejs
```

1.2. Do the installation as described at:
https://github.com/nodesource/distributions

```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
```


