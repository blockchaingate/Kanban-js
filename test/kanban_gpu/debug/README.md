#Debug log files

This folder is a container for the log files generated during our crypto library tests. 

At the time of writing, a test run generates the files:

logTestCentralPU.txt

and 

logTestGraphicsPU.txt

The two files contain outputs of tests run of the same code, once ran as a CPP program and once ran as openCL program.
 
1. The two files are expected to be nearly identical. There should be no differences in the data printouts. The only expected differences are in messages, pointer locations, etc.

2. The two files may be large and are expected to be compared with a diff tool. On ubuntu, ``meld`` is one of many recommended diff tools.
