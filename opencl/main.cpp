#include "gpu.h"
#include "server.h"
#include "logging.h"
#include <sstream>
#include <iostream>
#include <assert.h>
#include <iomanip>
#include <string.h>

#include <fcntl.h> //<- fcntl used to set std::cin's flags to blocking
#include <unistd.h> //<- linux read
#include <poll.h>
#include <sys/select.h>


const int bufferSize = 10000000;
const int bufferSizeMetaData = 1000;
char inputBuffer[bufferSize];
char inputBufferMetaData[bufferSizeMetaData];
char gpuOutputBuffer[bufferSize];
int totalCouts = 0;

extern Logger logServer;

extern int testMain();

int main(int numberOfArguments, char *arguments[]) {
  if (numberOfArguments == 2)
    if (((std::string) arguments[1]) == "test")
      return testMain();
  Server theServer;
  if (!theServer.Run()) {
    logServer << "Graceful exit with errors. ";
    return - 1;
  }
  return 0;
}
